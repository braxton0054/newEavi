#!/usr/bin/env python3
"""Add dark: Tailwind variants to super-admin and settings pages."""
import re
import os

FILES = [
    "/root/eavi-college/src/app/super-admin/courses/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/admissions/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/email/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/sms/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/bursary/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/reporting/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/credentials/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/whatsapp/page.tsx",
    "/root/eavi-college/src/app/super-admin/settings/fee-structures/page.tsx",
    "/root/eavi-college/src/components/AdminSidebar.tsx",
]

# Mapping: original class -> replacement with dark variant
# Pattern from super-admin/page.tsx:
#   bg-white -> dark:bg-zinc-950
#   border-zinc-100 -> dark:border-zinc-800
#   text-zinc-900 -> dark:text-zinc-100
#   text-zinc-400/500 -> dark:text-zinc-400
#   hover:bg-zinc-50 -> dark:hover:bg-zinc-800
#   bg-zinc-50 -> dark:bg-zinc-900
# Extended mappings (same tone logic for other shades):
#   border-zinc-200 -> dark:border-zinc-700 (one step darker from 100->800)
#   border-zinc-300 -> dark:border-zinc-600
#   text-zinc-700 -> dark:text-zinc-300
#   text-zinc-600 -> dark:text-zinc-400
#   text-zinc-800 -> dark:text-zinc-200
#   bg-zinc-100 -> dark:bg-zinc-800
#   hover:bg-zinc-100 -> dark:hover:bg-zinc-800
#   hover:bg-zinc-200 -> dark:hover:bg-zinc-700
#   border-gray-200 -> dark:border-zinc-700
#   text-gray-300 -> dark:text-zinc-600
#   text-gray-500 -> dark:text-zinc-400
#   bg-gray-200/80 -> dark:bg-zinc-800/80

# Build replacements. We process each line and add dark: variants.
# Since we're adding text, not replacing, we need to be careful with className="..." strings.

def add_dark_to_classnames(content):
    """Add dark: variants to Tailwind classes inside className attributes."""
    
    # Define all class-to-dark mappings
    mappings = {
        # bg
        'bg-white': 'bg-white dark:bg-zinc-950',
        'bg-zinc-50': 'bg-zinc-50 dark:bg-zinc-900',
        'bg-zinc-100': 'bg-zinc-100 dark:bg-zinc-800',
        'bg-gray-50': 'bg-gray-50 dark:bg-zinc-900',
        'bg-green-50': 'bg-green-50 dark:bg-green-950',
        'bg-red-50': 'bg-red-50 dark:bg-red-950',
        'bg-blue-50': 'bg-blue-50 dark:bg-blue-950',
        
        # border
        'border-zinc-100': 'border-zinc-100 dark:border-zinc-800',
        'border-zinc-200': 'border-zinc-200 dark:border-zinc-700',
        'border-zinc-300': 'border-zinc-300 dark:border-zinc-600',
        'border-green-200': 'border-green-200 dark:border-green-800',
        'border-red-200': 'border-red-200 dark:border-red-800',
        'border-blue-200': 'border-blue-200 dark:border-blue-800',
        'border-blue-100': 'border-blue-100 dark:border-blue-900',
        'border-gray-200/80': 'border-gray-200/80 dark:border-zinc-700/80',
        
        # text
        'text-zinc-900': 'text-zinc-900 dark:text-zinc-100',
        'text-zinc-800': 'text-zinc-800 dark:text-zinc-200',
        'text-zinc-700': 'text-zinc-700 dark:text-zinc-300',
        'text-zinc-600': 'text-zinc-600 dark:text-zinc-400',
        'text-zinc-500': 'text-zinc-500 dark:text-zinc-400',
        'text-zinc-400': 'text-zinc-400 dark:text-zinc-500',
        'text-gray-500': 'text-gray-500 dark:text-zinc-400',
        'text-gray-300': 'text-gray-300 dark:text-zinc-600',
        'text-green-700': 'text-green-700 dark:text-green-400',
        'text-red-600': 'text-red-600 dark:text-red-400',
        'text-red-500': 'text-red-500 dark:text-red-400',
        
        # hover:bg
        'hover:bg-zinc-50/50': 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50',
        'hover:bg-zinc-50': 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
        'hover:bg-zinc-100': 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
        'hover:bg-zinc-200': 'hover:bg-zinc-200 dark:hover:bg-zinc-700',
        'hover:bg-red-50': 'hover:bg-red-50 dark:hover:bg-red-950',
        'hover:file:bg-blue-100': 'hover:file:bg-blue-100 dark:hover:file:bg-blue-900',
        
        # file:bg
        'file:bg-blue-50': 'file:bg-blue-50 dark:file:bg-blue-950',
        
        # bg with opacity
        'bg-blue-50/30': 'bg-blue-50/30 dark:bg-blue-950/30',
        'bg-blue-50/40': 'bg-blue-50/40 dark:bg-blue-950/40',
        'bg-green-50 text-green-700 border border-green-200': 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
        'bg-red-50 text-red-700 border border-red-200': 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
        
        # The spinner has border-2 border-blue-700 border-t-transparent - no change needed
    }
    
    # We need to be smart about this. Let's do line-by-line processing.
    # For each line, we find className="..." or className={`...`} and add dark variants.
    
    # Pattern: find className strings
    lines = content.split('\n')
    result = []
    
    for line in lines:
        # Find className="..." patterns
        # Replace simple className="..." values
        # We'll use a multi-pass approach on each line
        
        modified = line
        
        # Handle the composite message div patterns first (they span multiple tokens)
        # bg-green-50 text-green-700 border border-green-200
        # bg-red-50 text-red-700 border border-red-200
        # These need careful handling because they're in template literals
        
        # Now do individual class replacements in order (most specific first to avoid partial overlaps)
        
        # Process composite replacements
        composites = [
            ('hover:bg-zinc-50/50', 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50'),
            ('hover:file:bg-blue-100', 'hover:file:bg-blue-100 dark:hover:file:bg-blue-900'),
            ('file:bg-blue-50', 'file:bg-blue-50 dark:file:bg-blue-950'),
            ('hover:bg-zinc-200', 'hover:bg-zinc-200 dark:hover:bg-zinc-700'),
            ('hover:bg-zinc-100', 'hover:bg-zinc-100 dark:hover:bg-zinc-800'),
            ('hover:bg-zinc-50', 'hover:bg-zinc-50 dark:hover:bg-zinc-800'),
            ('hover:bg-red-50', 'hover:bg-red-50 dark:hover:bg-red-950'),
            ('bg-blue-50/40', 'bg-blue-50/40 dark:bg-blue-950/40'),
            ('bg-blue-50/30', 'bg-blue-50/30 dark:bg-blue-950/30'),
            ('border-gray-200/80', 'border-gray-200/80 dark:border-zinc-700/80'),
            ('border-blue-100', 'border-blue-100 dark:border-blue-900'),
            ('border-blue-200', 'border-blue-200 dark:border-blue-800'),
            ('border-green-200', 'border-green-200 dark:border-green-800'),
            ('border-red-200', 'border-red-200 dark:border-red-800'),
            ('border-zinc-100', 'border-zinc-100 dark:border-zinc-800'),
            ('border-zinc-200', 'border-zinc-200 dark:border-zinc-700'),
            ('border-zinc-300', 'border-zinc-300 dark:border-zinc-600'),
            ('text-zinc-900', 'text-zinc-900 dark:text-zinc-100'),
            ('text-zinc-800', 'text-zinc-800 dark:text-zinc-200'),
            ('text-zinc-700', 'text-zinc-700 dark:text-zinc-300'),
            ('text-zinc-600', 'text-zinc-600 dark:text-zinc-400'),
            ('text-zinc-500', 'text-zinc-500 dark:text-zinc-400'),
            ('text-zinc-400', 'text-zinc-400 dark:text-zinc-500'),
            ('text-gray-500', 'text-gray-500 dark:text-zinc-400'),
            ('text-gray-300', 'text-gray-300 dark:text-zinc-600'),
            ('text-green-700', 'text-green-700 dark:text-green-400'),
            ('text-red-600', 'text-red-600 dark:text-red-400'),
            ('text-red-500', 'text-red-500 dark:text-red-400'),
            ('bg-zinc-50', 'bg-zinc-50 dark:bg-zinc-900'),
            ('bg-zinc-100', 'bg-zinc-100 dark:bg-zinc-800'),
            ('bg-gray-50', 'bg-gray-50 dark:bg-zinc-900'),
            ('bg-green-50', 'bg-green-50 dark:bg-green-950'),
            ('bg-red-50', 'bg-red-50 dark:bg-red-950'),
            ('bg-blue-50', 'bg-blue-50 dark:bg-blue-950'),
            ('bg-white', 'bg-white dark:bg-zinc-950'),
        ]
        
        for old, new in composites:
            # Only replace inside className attributes (between quotes after className=)
            # Use word boundary matching to avoid partial class matches
            modified = modified.replace(old, new)
        
        result.append(modified)
    
    return '\n'.join(result)


def process_file(filepath):
    """Read, transform, and write a file."""
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = add_dark_to_classnames(content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"✓ Updated: {os.path.relpath(filepath, '/root/eavi-college/src')}")
        return True
    else:
        print(f"  No changes: {os.path.relpath(filepath, '/root/eavi-college/src')}")
        return False


if __name__ == '__main__':
    for f in FILES:
        process_file(f)
    print("\nDone!")
