import pdfplumber

with pdfplumber.open('knowledge-base/constitution_of_india.pdf') as pdf:
    page = pdf.pages[9]
    page_width = page.width  # 360
    
    # The margin heading column is on the LEFT (x0 < ~90)
    # The main text column is on the RIGHT (x0 >= ~90)
    # Let's confirm by extracting left vs right sides
    
    MARGIN_X_CUTOFF = 90  # headings are in left ~90 pts

    # Extract left margin words (article headings)
    left_words = [w for w in page.extract_words() if w['x0'] < MARGIN_X_CUTOFF]
    right_words = [w for w in page.extract_words() if w['x0'] >= MARGIN_X_CUTOFF]

    print('=== LEFT MARGIN WORDS (headings) ===')
    for w in left_words[:20]:
        print('  top=' + str(round(w['top'],1)) + ' x0=' + str(round(w['x0'],1)) + ': ' + w['text'])

    print()
    print('=== MAIN TEXT WORDS (right column) ===')
    for w in right_words[:30]:
        print('  top=' + str(round(w['top'],1)) + ' x0=' + str(round(w['x0'],1)) + ': ' + w['text'])

    print()
    # Now test extracting two regions separately
    # Main content bbox: (x0, top, x1, bottom)
    main_bbox = (MARGIN_X_CUTOFF, 50, page_width, page.height - 50)
    margin_bbox = (0, 50, MARGIN_X_CUTOFF, page.height - 50)
    
    main_crop = page.crop(main_bbox)
    main_text = main_crop.extract_text()
    
    margin_crop = page.crop(margin_bbox)
    margin_text = margin_crop.extract_text()
    
    print('=== MAIN TEXT (cropped, first 800 chars) ===')
    print(repr(main_text[:800] if main_text else 'EMPTY'))
    
    print()
    print('=== MARGIN HEADINGS (cropped) ===')
    print(repr(margin_text[:500] if margin_text else 'EMPTY'))
