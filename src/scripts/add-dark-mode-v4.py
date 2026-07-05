#!/usr/bin/env python3
"""
Add dark: Tailwind variants to className strings.
Token-aware: processes each class individually to avoid cascading.
"""
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

# Mapping: light class -> dark class
MAPPING = {
    'bg-white': 'dark:bg-zinc-950',
    'bg-zinc-50': 'dark:bg-zinc-900',
    'bg-zinc-100': 'dark:bg-zinc-800',
    'bg-gray-50': 'dark:bg-zinc-900',
    'bg-green-50': 'dark:bg-green-950',
    'bg-red-50': 'dark:bg-red-950',
    'bg-blue-50': 'dark:bg-blue-950',
    'bg-blue-50/30': 'dark:bg-blue-950/30',
    'bg-blue-50/40': 'dark:bg-blue-950/40',
    'border-zinc-100': 'dark:border-zinc-800',
    'border-zinc-200': 'dark:border-zinc-700',
    'border-zinc-300': 'dark:border-zinc-600',
    'border-green-200': 'dark:border-green-800',
    'border-red-200': 'dark:border-red-800',
    'border-blue-200': 'dark:border-blue-800',
    'border-blue-100': 'dark:border-blue-900',
    'border-gray-200/80': 'dark:border-zinc-700/80',
    'text-zinc-900': 'dark:text-zinc-100',
    'text-zinc-800': 'dark:text-zinc-200',
    'text-zinc-700': 'dark:text-zinc-300',
    'text-zinc-600': 'dark:text-zinc-400',
    'text-zinc-500': 'dark:text-zinc-400',
    'text-zinc-400': 'dark:text-zinc-500',
    'text-gray-500': 'dark:text-zinc-400',
    'text-gray-300': 'dark:text-zinc-600',
    'text-green-700': 'dark:text-green-400',
    'text-red-600': 'dark:text-red-400',
    'text-red-500': 'dark:text-red-400',
    'hover:bg-zinc-50/50': 'dark:hover:bg-zinc-800/50',
    'hover:bg-zinc-50': 'dark:hover:bg-zinc-800',
    'hover:bg-zinc-100': 'dark:hover:bg-zinc-800',
    'hover:bg-zinc-200': 'dark:hover:bg-zinc-700',
    'hover:bg-red-50': 'dark:hover:bg-red-950',
    'hover:file:bg-blue-100': 'dark:hover:file:bg-blue-900',
    'file:bg-blue-50': 'dark:file:bg-blue-950',
}


def add_dark_to_classname_string(s):
    """Process a className string by splitting tokens, adding dark variants, and rejoining."""
    # Split into tokens (whitespace-separated)
    tokens = s.split()
    result = []
    existing_dark_classes = set()
    
    # First pass: collect all existing dark: classes
    for t in tokens:
        if t.startswith('dark:'):
            existing_dark_classes.add(t)
    
    # Second pass: add missing dark: variants
    for t in tokens:
        result.append(t)
        if t in MAPPING and MAPPING[t] not in existing_dark_classes:
            result.append(MAPPING[t])
            existing_dark_classes.add(MAPPING[t])
    
    return ' '.join(result)


def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    modified = False
    
    for i in range(len(lines)):
        line = lines[i]
        new_line = line
        
        # Find all className="..." patterns
        for m in re.finditer(r'className="([^"]*)"', line):
            old_val = m.group(1)
            new_val = add_dark_to_classname_string(old_val)
            if new_val != old_val:
                old_full = 'className="' + old_val + '"'
                new_full = 'className="' + new_val + '"'
                new_line = new_line.replace(old_full, new_full)
                modified = True
        
        # Find single-line className={`...`} patterns  
        for m in re.finditer(r'className={`([^`]*)`}', line):
            old_val = m.group(1)
            new_val = add_dark_to_classname_string(old_val)
            if new_val != old_val:
                old_full = 'className={`' + old_val + '`}'
                new_full = 'className={`' + new_val + '`}'
                new_line = new_line.replace(old_full, new_full)
                modified = True
        
        lines[i] = new_line
    
    # Handle multi-line className={`...`} patterns
    # These have ` on one line and `} on a later line
    i = 0
    while i < len(lines):
        line = lines[i]
        if 'className={`' in line and '`}' not in line:
            # Find start of template content
            start_idx = line.index('className={`') + len('className={`')
            template_parts = [line[start_idx:]]
            
            # Collect lines until `}
            j = i + 1
            while j < len(lines) and '`}' not in lines[j]:
                template_parts.append(lines[j])
                j += 1
            
            if j < len(lines):
                close_idx = lines[j].index('`}')
                template_parts.append(lines[j][:close_idx])
                
                full_template = '\n'.join(template_parts)
                new_template = add_dark_to_classname_string(full_template)
                
                if new_template != full_template:
                    new_parts = new_template.split('\n')
                    lines[i] = line[:start_idx] + new_parts[0]
                    for k in range(1, len(new_parts)):
                        if i + k < len(lines):
                            lines[i + k] = new_parts[k]
                    # Handle the closing line
                    lines[j] = lines[j][close_idx:]
                    modified = True
                i = j
        i += 1
    
    new_content = '\n'.join(lines)
    
    if modified:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print("Updated:", os.path.relpath(filepath, '/root/eavi-college/src'))
    else:
        print("No changes:", os.path.relpath(filepath, '/root/eavi-college/src'))


if __name__ == '__main__':
    for fp in FILES:
        process_file(fp)
    print("\nDone!")
