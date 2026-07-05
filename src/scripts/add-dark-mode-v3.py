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

# Rules: (class_regex, dark_suffix)
# Only add dark: if:
#   1. The pattern matches as a whole word
#   2. The dark variant doesn't already exist after the match

RULES = [
    (r'(?<![-\w])bg-white(?![-\w])(?=.*(?<!dark:)bg-white)', 'dark:bg-zinc-950'),
    (r'(?<![-\w])bg-zinc-50(?![-\w])(?=.*(?<!dark:)bg-zinc-50)(?!.*dark:bg-zinc-900)', 'dark:bg-zinc-900'),
    (r'(?<![-\w])bg-zinc-100(?![-\w])(?!.*dark:bg-zinc-800)', 'dark:bg-zinc-800'),
    (r'(?<![-\w])bg-gray-50(?![-\w])(?!.*dark:bg-zinc-900)', 'dark:bg-zinc-900'),
    (r'(?<![-\w])bg-green-50(?![-\w])(?!.*dark:bg-green-950)', 'dark:bg-green-950'),
    (r'(?<![-\w])bg-red-50(?![-\w])(?!.*dark:bg-red-950)', 'dark:bg-red-950'),
    (r'(?<![-\w])bg-blue-50(?![-\w])(?!.*dark:bg-blue-950)', 'dark:bg-blue-950'),
    (r'(?<![-\w])bg-blue-50/30(?![-\w])(?!.*dark:bg-blue-950/30)', 'dark:bg-blue-950/30'),
    (r'(?<![-\w])bg-blue-50/40(?![-\w])(?!.*dark:bg-blue-950/40)', 'dark:bg-blue-950/40'),
    (r'(?<![-\w])border-zinc-100(?![-\w])(?!.*dark:border-zinc-800)', 'dark:border-zinc-800'),
    (r'(?<![-\w])border-zinc-200(?![-\w])(?!.*dark:border-zinc-700)', 'dark:border-zinc-700'),
    (r'(?<![-\w])border-zinc-300(?![-\w])(?!.*dark:border-zinc-600)', 'dark:border-zinc-600'),
    (r'(?<![-\w])border-green-200(?![-\w])(?!.*dark:border-green-800)', 'dark:border-green-800'),
    (r'(?<![-\w])border-red-200(?![-\w])(?!.*dark:border-red-800)', 'dark:border-red-800'),
    (r'(?<![-\w])border-blue-200(?![-\w])(?!.*dark:border-blue-800)', 'dark:border-blue-800'),
    (r'(?<![-\w])border-blue-100(?![-\w])(?!.*dark:border-blue-900)', 'dark:border-blue-900'),
    (r'(?<![-\w])border-gray-200/80(?![-\w])(?!.*dark:border-zinc-700/80)', 'dark:border-zinc-700/80'),
    (r'(?<![-\w])text-zinc-900(?![-\w])(?!.*dark:text-zinc-100)', 'dark:text-zinc-100'),
    (r'(?<![-\w])text-zinc-800(?![-\w])(?!.*dark:text-zinc-200)', 'dark:text-zinc-200'),
    (r'(?<![-\w])text-zinc-700(?![-\w])(?!.*dark:text-zinc-300)', 'dark:text-zinc-300'),
    (r'(?<![-\w])text-zinc-600(?![-\w])(?!.*dark:text-zinc-400)', 'dark:text-zinc-400'),
    (r'(?<![-\w])text-zinc-500(?![-\w])(?!.*dark:text-zinc-400)', 'dark:text-zinc-400'),
    (r'(?<![-\w])text-zinc-400(?![-\w])(?!.*dark:text-zinc-500)', 'dark:text-zinc-500'),
    (r'(?<![-\w])text-gray-500(?![-\w])(?!.*dark:text-zinc-400)', 'dark:text-zinc-400'),
    (r'(?<![-\w])text-gray-300(?![-\w])(?!.*dark:text-zinc-600)', 'dark:text-zinc-600'),
    (r'(?<![-\w])text-green-700(?![-\w])(?!.*dark:text-green-400)', 'dark:text-green-400'),
    (r'(?<![-\w])text-red-600(?![-\w])(?!.*dark:text-red-400)', 'dark:text-red-400'),
    (r'(?<![-\w])text-red-500(?![-\w])(?!.*dark:text-red-400)', 'dark:text-red-400'),
    (r'(?<![-\w])hover:bg-zinc-50/50(?![-\w])(?!.*dark:hover:bg-zinc-800/50)', 'dark:hover:bg-zinc-800/50'),
    (r'(?<![-\w])hover:bg-zinc-50(?![-\w])(?!.*dark:hover:bg-zinc-800)', 'dark:hover:bg-zinc-800'),
    (r'(?<![-\w])hover:bg-zinc-100(?![-\w])(?!.*dark:hover:bg-zinc-800)', 'dark:hover:bg-zinc-800'),
    (r'(?<![-\w])hover:bg-zinc-200(?![-\w])(?!.*dark:hover:bg-zinc-700)', 'dark:hover:bg-zinc-700'),
    (r'(?<![-\w])hover:bg-red-50(?![-\w])(?!.*dark:hover:bg-red-950)', 'dark:hover:bg-red-950'),
    (r'(?<![-\w])hover:file:bg-blue-100(?![-\w])(?!.*dark:hover:file:bg-blue-900)', 'dark:hover:file:bg-blue-900'),
    (r'(?<![-\w])file:bg-blue-50(?![-\w])(?!.*dark:file:bg-blue-950)', 'dark:file:bg-blue-950'),
]


def add_dark_to_str(s):
    """Add dark: variants to className content string."""
    for pattern, dark_class in RULES:
        def make_replacer(dc):
            return lambda m: m.group(0) + ' ' + dc
        s = re.sub(pattern, make_replacer(dark_class), s)
    return s


def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    
    # Handle simple className="..."
    def replace_simple(m):
        inner = m.group(1)
        new_inner = add_dark_to_str(inner)
        return 'className="' + new_inner + '"'
    
    new_content = re.sub(r'className="([^"]*)"', replace_simple, new_content)
    
    # Handle single-line className={`...`}
    def replace_template(m):
        inner = m.group(1)
        new_inner = add_dark_to_str(inner)
        return 'className={`' + new_inner + '`}'
    
    new_content = re.sub(r'className={`([^`]*)`}', replace_template, new_content)
    
    # Handle multi-line className={`...`} - only for files that have them
    if 'className={`' in new_content:
        # Find all className={` occurrences
        lines = new_content.split('\n')
        result_lines = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if 'className={`' in line and '`}' not in line:
                # Start of multi-line template
                start_idx = line.index('className={`') + len('className={`')
                template_parts = [line[start_idx:]]
                j = i + 1
                while j < len(lines) and '`}' not in lines[j]:
                    template_parts.append(lines[j])
                    j += 1
                
                if j < len(lines):
                    close_idx = lines[j].index('`}')
                    template_parts.append(lines[j][:close_idx])
                    full_template = '\n'.join(template_parts)
                    new_template = add_dark_to_str(full_template)
                    
                    # Reconstruct
                    new_parts = new_template.split('\n')
                    result_lines.append(line[:start_idx] + new_parts[0])
                    for k in range(1, len(new_parts)):
                        result_lines.append(new_parts[k])
                    result_lines.append(lines[j][close_idx:])
                    i = j + 1
                    continue
            result_lines.append(line)
            i += 1
        new_content = '\n'.join(result_lines)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print("Updated:", os.path.relpath(filepath, '/root/eavi-college/src'))
        return True
    else:
        print("No changes:", os.path.relpath(filepath, '/root/eavi-college/src'))
        return False


if __name__ == '__main__':
    for fp, _ in FILES:
        process_file(fp)
    print("\nDone!")
