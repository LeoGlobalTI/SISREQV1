
content = open('context/SisreqContext.tsx').read()
old_line = "const newId = `p-${process.id.substring(0,8)}-a-${alert.id.substring(0,8)}-d-${alert.triggerDate}`.substring(0, 36);"
new_line = "const newId = genUUID();"
if old_line in content:
    content = content.replace(old_line, new_line)
    open('context/SisreqContext.tsx', 'w').write(content)
    print("Success")
else:
    print("Not found")
