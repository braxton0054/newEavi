#!/usr/bin/env python3
"""
Fix dark: Tailwind class variants across super-admin files.
Uses regex with lookahead to avoid cascading replacements.
"""
import re
import os

FILES = [
    ("/root/eavi-college/src/app/super-admin/courses/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/admissions/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/email/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/sms/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/bursary/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/reporting/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/credentials/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/whatsapp/page.tsx", False),
    ("/root/eavi-college/src/app/super-admin/settings/fee-structures/page.tsx", False),
    ("/root/eavi-college/src/components/AdminSidebar.tsx", True),
]

# Each mapping: (pattern_regex, dark_class, lookbehind_condition)
# Only add dark: if:
#   1. The pattern matches as a whole word
#   2. It's not already preceded by dark:
#   3. The dark class doesn't already exist nearby

# Build replacement rules
# Format: (class_pattern, dark_replacement)
# class_pattern: regex that matches the exact class
# dark_replacement: the dark: variant to add AFTER the class

RULES = [
    # Single classes - match only when surrounded by word boundaries and NOT inside dark:
    (r'(?<![-\w])bg-white(?![-\w])(?!.*dark:bg-zinc-950)', lambda m: 'bg-white dark:bg-zinc-950'),
    (r'(?<![-\w])bg-zinc-50(?![-\w])(?!.*dark:bg-zinc-900)', lambda m: 'bg-zinc-50 dark:bg-zinc-900'),
    (r'(?<![-\w])bg-zinc-100(?![-\w])(?!.*dark:bg-zinc-800)', lambda m: 'bg-zinc-100 dark:bg-zinc-800'),
    (r'(?<![-\w])bg-gray-50(?![-\w])(?!.*dark:bg-zinc-900)', lambda m: 'bg-gray-50 dark:bg-zinc-900'),
    (r'(?<![-\w])bg-green-50(?![-\w])(?!.*dark:bg-green-950)', lambda m: 'bg-green-50 dark:bg-green-950'),
    (r'(?<![-\w])bg-red-50(?![-\w])(?!.*dark:bg-red-950)', lambda m: 'bg-red-50 dark:bg-red-950'),
    (r'(?<![-\w])bg-blue-50(?![-\w])(?!.*dark:bg-blue-950)', lambda m: 'bg-blue-50 dark:bg-blue-950'),
    (r'(?<![-\w])bg-blue-50/30(?![-\w])(?!.*dark:bg-blue-950/30)', lambda m: 'bg-blue-50/30 dark:bg-blue-950/30'),
    (r'(?<![-\w])bg-blue-50/40(?![-\w])(?!.*dark:bg-blue-950/40)', lambda m: 'bg-blue-50/40 dark:bg-blue-950/40'),
    (r'(?<![-\w])border-zinc-100(?![-\w])(?!.*dark:border-zinc-800)', lambda m: 'border-zinc-100 dark:border-zinc-800'),
    (r'(?<![-\w])border-zinc-200(?![-\w])(?!.*dark:border-zinc-700)', lambda m: 'border-zinc-200 dark:border-zinc-700'),
    (r'(?<![-\w])border-zinc-300(?![-\w])(?!.*dark:border-zinc-600)', lambda m: 'border-zinc-300 dark:border-zinc-600'),
    (r'(?<![-\w])border-green-200(?![-\w])(?!.*dark:border-green-800)', lambda m: 'border-green-200 dark:border-green-800'),
    (r'(?<![-\w])border-red-200(?![-\w])(?!.*dark:border-red-800)', lambda m: 'border-red-200 dark:border-red-800'),
    (r'(?<![-\w])border-blue-200(?![-\w])(?!.*dark:border-blue-800)', lambda m: 'border-blue-200 dark:border-blue-800'),
    (r'(?<![-\w])border-blue-100(?![-\w])(?!.*dark:border-blue-900)', lambda m: 'border-blue-100 dark:border-blue-900'),
    (r'(?<![-\w])border-gray-200/80(?![-\w])(?!.*dark:border-zinc-700/80)', lambda m: 'border-gray-200/80 dark:border-zinc-700/80'),
    (r'(?<![-\w])text-zinc-900(?![-\w])(?!.*dark:text-zinc-100)', lambda m: 'text-zinc-900 dark:text-zinc-100'),
    (r'(?<![-\w])text-zinc-800(?![-\w])(?!.*dark:text-zinc-200)', lambda m: 'text-zinc-800 dark:text-zinc-200'),
    (r'(?<![-\w])text-zinc-700(?![-\w])(?!.*dark:text-zinc-300)', lambda m: 'text-zinc-700 dark:text-zinc-300'),
    (r'(?<![-\w])text-zinc-600(?![-\w])(?!.*dark:text-zinc-400)', lambda m: 'text-zinc-600 dark:text-zinc-400'),
    (r'(?<![-\w])text-zinc-500(?![-\w])(?!.*dark:text-zinc-400)', lambda m: 'text-zinc-500 dark:text-zinc-400'),
    (r'(?<![-\w])text-zinc-400(?![-\w])(?!.*dark:text-zinc-500)', lambda m: 'text-zinc-400 dark:text-zinc-500'),
    (r'(?<![-\w])text-gray-500(?![-\w])(?!.*dark:text-zinc-400)', lambda m: 'text-gray-500 dark:text-zinc-400'),
    (r'(?<![-\w])text-gray-300(?![-\w])(?!.*dark:text-zinc-600)', lambda m: 'text-gray-300 dark:text-zinc-600'),
    (r'(?<![-\w])text-green-700(?![-\w])(?!.*dark:text-green-400)', lambda m: 'text-green-700 dark:text-green-400'),
    (r'(?<![-\w])text-red-600(?![-\w])(?!.*dark:text-red-400)', lambda m: 'text-red-600 dark:text-red-400'),
    (r'(?<![-\w])text-red-500(?![-\w])(?!.*dark:text-red-400)', lambda m: 'text-red-500 dark:text-red-400'),
    (r'(?<![-\w])hover:bg-zinc-50/50(?![-\w])(?!.*dark:hover:bg-zinc-800/50)', lambda m: 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50'),
    (r'(?<![-\w])hover:bg-zinc-50(?![-\w])(?!.*dark:hover:bg-zinc-800)', lambda m: 'hover:bg-zinc-50 dark:hover:bg-zinc-800'),
    (r'(?<![-\w])hover:bg-zinc-100(?![-\w])(?!.*dark:hover:bg-zinc-800)', lambda m: 'hover:bg-zinc-100 dark:hover:bg-zinc-800'),
    (r'(?<![-\w])hover:bg-zinc-200(?![-\w])(?!.*dark:hover:bg-zinc-700)', lambda m: 'hover:bg-zinc-200 dark:hover:bg-zinc-700'),
    (r'(?<![-\w])hover:bg-red-50(?![-\w])(?!.*dark:hover:bg-red-950)', lambda m: 'hover:bg-red-50 dark:hover:bg-red-950'),
    (r'(?<![-\w])hover:file:bg-blue-100(?![-\w])(?!.*dark:hover:file:bg-blue-900)', lambda m: 'hover:file:bg-blue-100 dark:hover:file:bg-blue-900'),
    (r'(?<![-\w])file:bg-blue-50(?![-\w])(?!.*dark:file:bg-blue-950)', lambda m: 'file:bg-blue-50 dark:file:bg-blue-950'),
]


def add_dark_in_classname(match):
    """Replace className content by adding dark: variants."""
    inner = match.group(1)  # Content inside the quotes
    
    # Apply each rule once, checking that the dark variant doesn't already exist
    for pattern, replacer in RULES:
        # Check if the dark variant is already present in this string
        # The replacer lambda returns the replacement with dark: suffix
        # But we only want to add it if not already there
        # The pattern already includes a negative lookahead for the dark class
        inner = re.sub(pattern, replacer, inner)
    
    return f'className="{inner}"'


def add_dark_in_template(match):
    """Replace className={`...`} content by adding dark: variants."""
    inner = match.group(1)  # Content inside the backticks
    
    for pattern, replacer in RULES:
        inner = re.sub(pattern, replacer, inner)
    
    return f'className={`${{inner}`}'


def process_file(filepath, is_sidebar):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    
    # Step 1: Handle className="..." 
    new_content = re.sub(
        r'className="([^"]*)"',
        add_dark_in_classname,
        new_content
    )
    
    # Step 2: Handle single-line className={`...`}
    new_content = re.sub(
        r'className={`([^`]*)`}',
        lambda m: f'className={`${{process_template_inner(m.group(1))}`}',
        new_content
    )
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"✓ Fixed: {os.path.relpath(filepath, '/root/eavi-college/src')}")
        return True
    else:
        print(f"  No changes needed: {os.path.relpath(filepath, '/root/eavi-college/src')}")
        return False


def process_template_inner(inner):
    for pattern, replacer in RULES:
        inner = re.sub(pattern, replacer, inner)
    return inner


if __name__ == '__main__':
    for fp, is_sidebar in FILES:
        process_file(fp, is_sidebar)
    print("\nDone!")
