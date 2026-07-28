import pdfplumber

with pdfplumber.open('knowledge-base/constitution_of_india.pdf') as pdf:
    page = pdf.pages[9]
    print('Page width:', page.width)
    print('Page height:', page.height)
    print()

    words = page.extract_words()
    print('First 30 words with x0 positions:')
    for w in words[:30]:
        x0 = w['x0']
        x1 = w['x1']
        top = w['top']
        txt = w['text']
        print('  x0=' + str(round(x0,1)) + ' x1=' + str(round(x1,1)) + ' top=' + str(round(top,1)) + ': ' + txt)

    print()
    print('Words containing 21 or Protection or liberty:')
    for w in words:
        txt = w['text']
        if txt in ('21.', 'Protection', 'liberty', 'life', 'personal'):
            x0 = w['x0']
            print('  x0=' + str(round(x0,1)) + ': ' + txt)
