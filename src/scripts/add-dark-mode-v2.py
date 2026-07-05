#!/usr/bin/env python3
"""
Add dark: variants to Tailwind classes inside className strings.
Robust version: only adds dark: if not already present, handles cascading properly.
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

# Dark mode class mappings (light -> dark variant)
# Order matters: more specific patterns first
DARK_MAP = [
    (r'(?<![-\w])bg-white(?![-\w])', 'dark:bg-zinc-950'),
    (r'(?<![-\w])bg-zinc-50(?![-\w])', 'dark:bg-zinc-900'),
    (r'(?<![-\w])bg-zinc-100(?![-\w])', 'dark:bg-zinc-800'),
    (r'(?<![-\w])bg-gray-50(?![-\w])', 'dark:bg-zinc-900'),
    (r'(?<![-\w])bg-green-50(?![-\w])', 'dark:bg-green-950'),
    (r'(?<![-\w])bg-red-50(?![-\w])', 'dark:bg-red-950'),
    (r'(?<![-\w])bg-blue-50(?![-\w])', 'dark:bg-blue-950'),
    (r'(?<![-\w])bg-blue-50/40(?![-\w])', 'dark:bg-blue-950/40'),
    (r'(?<![-\w])bg-blue-50/30(?![-\w])', 'dark:bg-blue-950/30'),
    (r'(?<![-\w])border-zinc-100(?![-\w])', 'dark:border-zinc-800'),
    (r'(?<![-\w])border-zinc-200(?![-\w])', 'dark:border-zinc-700'),
    (r'(?<![-\w])border-zinc-300(?![-\w])', 'dark:border-zinc-600'),
    (r'(?<![-\w])border-green-200(?![-\w])', 'dark:border-green-800'),
    (r'(?<![-\w])border-red-200(?![-\w])', 'dark:border-red-800'),
    (r'(?<![-\w])border-blue-200(?![-\w])', 'dark:border-blue-800'),
    (r'(?<![-\w])border-blue-100(?![-\w])', 'dark:border-blue-900'),
    (r'(?<![-\w])border-gray-200/80(?![-\w])', 'dark:border-zinc-700/80'),
    (r'(?<![-\w])text-zinc-900(?![-\w])', 'dark:text-zinc-100'),
    (r'(?<![-\w])text-zinc-800(?![-\w])', 'dark:text-zinc-200'),
    (r'(?<![-\w])text-zinc-700(?![-\w])', 'dark:text-zinc-300'),
    (r'(?<![-\w])text-zinc-600(?![-\w])', 'dark:text-zinc-400'),
    (r'(?<![-\w])text-zinc-500(?![-\w])', 'dark:text-zinc-400'),
    (r'(?<![-\w])text-zinc-400(?![-\w])', 'dark:text-zinc-500'),
    (r'(?<![-\w])text-gray-500(?![-\w])', 'dark:text-zinc-400'),
    (r'(?<![-\w])text-gray-300(?![-\w])', 'dark:text-zinc-600'),
    (r'(?<![-\w])text-green-700(?![-\w])', 'dark:text-green-400'),
    (r'(?<![-\w])text-red-600(?![-\w])', 'dark:text-red-400'),
    (r'(?<![-\w])text-red-500(?![-\w])', 'dark:text-red-400'),
    (r'(?<![-\w])hover:bg-zinc-50/50(?![-\w])', 'dark:hover:bg-zinc-800/50'),
    (r'(?<![-\w])hover:bg-zinc-50(?![-\w])', 'dark:hover:bg-zinc-800'),
    (r'(?<![-\w])hover:bg-zinc-100(?![-\w])', 'dark:hover:bg-zinc-800'),
    (r'(?<![-\w])hover:bg-zinc-200(?![-\w])', 'dark:hover:bg-zinc-700'),
    (r'(?<![-\w])hover:bg-red-50(?![-\w])', 'dark:hover:bg-red-950'),
    (r'(?<![-\w])hover:file:bg-blue-100(?![-\w])', 'dark:hover:file:bg-blue-900'),
    (r'(?<![-\w])file:bg-blue-50(?![-\w])', 'dark:file:bg-blue-950'),
]


def add_dark_variant(match, dark_class):
    """Add dark: variant after the matched class if not already present."""
    full = match.group(0)
    # Check if a dark: variant for this class already exists
    # by looking at the rest of the line
    return f'{full} {dark_class}'


def process_classname_string(s):
    """Given a className string content (without the className= prefix), add dark: variants."""
    for pattern, dark_class in DARK_MAP:
        # Only add if the dark variant isn't already present
        # We use re.sub with a function that checks context
        def make_replacer(p, dc):
            def replacer(m):
                # Check if this class's dark variant already exists in the string
                # by looking ahead in the remaining text
                end = m.end()
                remaining = s[end:end + 100]  # Look ahead up to 100 chars
                if dc in remaining:
                    return m.group(0)
                return f'{m.group(0)} {dc}'
            return replacer
        
        s = re.sub(pattern, make_replacer(pattern, dark_class), s)
    return s


def find_classname_strings(content):
    """Find all className="..." or className={`...`} strings."""
    # Handle className={`...`}
    lines = content.split('\n')
    result = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Simple className="..." 
        for m in re.finditer(r'className="([^"]*)"', line):
            result.append((i, m.start(1), m.end(1), m.group(1)))
        
        # className={`...`} - can span multiple lines
        if 'className={`' in line:
            start_idx = line.index('className={`') + len('className={`')
            template = line[start_idx:]
            line_start = i
            col_start = start_idx
            
            # Find matching closing `}
            while '`}' not in template:
                i += 1
                if i >= len(lines):
                    break
                template += '\n' + lines[i]
            
            if '`}' in template:
                end_idx = template.index('`}')
                full_template = template[:end_idx]
                result.append((line_start, col_start, col_start + end_idx, full_template))
        
        i += 1
    
    return result


def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # Find all className strings
    
    # Simple className="..."
    for i in range(len(lines)):
        line = lines[i]
        # Handle className="..." (not template literal)
        for m in re.finditer(r'className="([^"]*)"', line):
            old_val = m.group(1)
            new_val = process_classname_string(old_val)
            if new_val != old_val:
                full_old = f'className="{old_val}"'
                full_new = f'className="{new_val}"'
                lines[i] = lines[i].replace(full_old, full_new)
    
    # Handle className={`...`} (template literals spanning multiple lines)
    # First, join lines that are clearly template literals
    i = 0
    while i < len(lines):
        line = lines[i]
        if 'className={`' in line:
            start = line.index('className={`') + len('className={`')
            # Collect the template content until `}
            template_lines = []
            current = line
            current_idx = i
            has_close = '`}' in current[start:]
            
            if has_close:
                end = current.index('`}', start)
                template_content = current[start:end]
                old_full_content = current[start:end]
                new_content = process_classname_string(template_content)
                if new_content != template_content:
                    lines[i] = current[:start] + new_content + current[end:]
            else:
                # Multi-line template
                template_content = current[start:]
                # Continue collecting lines
                j = i
                while '`}' not in lines[j]:
                    template_content += '\n' + lines[j]
                    j += 1
                    if j >= len(lines):
                        break
                
                # Actually this is getting complicated. Let me use a different approach
                # for multi-line templates.
                pass
        i += 1
    
    new_content = '\n'.join(lines)
    
    # Now handle multi-line template literals by processing the whole content
    # with a smarter regex
    def replace_template(m):
        full = m.group(0)
        inner = m.group(1)
        new_inner = process_classname_string(inner)
        if new_inner != inner:
            return full.replace(inner, new_inner)
        return full
    
    # Process all className={`...`} patterns (may span lines)
    # First, normalize line breaks within template literals for regex
    # Use a simpler approach: flag-based collection
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"  Simple replacements done for: {os.path.relpath(filepath, '/root/eavi-college/src')}")
    
    return new_content


def process_all_files():
    for fp in FILES:
        with open(fp, 'r') as f:
            content = f.read()
        
        # Process simple className="..." 
        new_content = re.sub(
            r'className="([^"]*)"',
            lambda m: f'className="{process_classname_string(m.group(1))}"',
            content
        )
        
        # Process template literal className={`...`}
        # These can span lines, so we need to handle them carefully
        # Find all className={` positions and their matching `}
        
        # Actually, let me use a multi-pass approach that works on the whole content
        
        if new_content != content:
            with open(fp, 'w') as f:
                f.write(new_content)
    
    print("Phase 1: Simple className=\"...\" replacements done")

# Phase 1: Fix simple className="..." patterns
process_all_files()

# Phase 2: Now handle template literals className={`...`}
# These are trickier because they span lines. Let me process each file manually.
for fp in FILES:
    with open(fp, 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    modified = False
    
    i = 0
    while i < len(lines):
        line = lines[i]
        if 'className={`' in line:
            # Find the start of template content
            start_idx = line.index('className={`') + len('className={`')
            template_parts = []
            
            if '`}' in line[start_idx:]:
                # Single line template
                end_idx = line.index('`}', start_idx)
                old_val = line[start_idx:end_idx]
                new_val = process_classname_string(old_val)
                if new_val != old_val:
                    lines[i] = line[:start_idx] + new_val + line[end_idx:]
                    modified = True
            else:
                # Multi-line template - collect until `} found
                template_parts = [line[start_idx:]]
                j = i + 1
                found_close = False
                while j < len(lines):
                    if '`}' in lines[j]:
                        end_idx = lines[j].index('`}')
                        template_parts.append(lines[j][:end_idx])
                        found_close = True
                        break
                    template_parts.append(lines[j])
                    j += 1
                
                if found_close:
                    old_val = '\n'.join(template_parts)
                    new_val = process_classname_string(old_val)
                    if new_val != old_val:
                        # Reconstruct the multi-line template
                        new_parts = new_val.split('\n')
                        lines[i] = line[:start_idx] + new_parts[0]
                        for k in range(1, len(new_parts)):
                            lines[i+k] = new_parts[k]
                        # Close the template
                        close_line_idx = i + len(new_parts) - 1
                        remaining = lines[j][end_idx:]
                        lines[j] = remaining  # j is the line that has `}`
                        modified = True
                    i = j  # Skip to end of multi-line
        i += 1
    
    if modified:
        with open(fp, 'w') as f:
            f.write('\n'.join(lines))
        print(f"  Template literal fixes done for: {os.path.relpath(fp, '/root/eavi-college/src')}")

print("\nPhase 2: Template literal className={`...`} fixes done")
