import pdfplumber

with pdfplumber.open('knowledge-base/constitution_of_india.pdf') as pdf:
    page = pdf.pages[9]
    print('width:', page.width)
    print('height:', page.height)
    print('bbox:', page.bbox)
    print('mediabox:', getattr(page, 'mediabox', 'N/A'))

    # Test: extract the full page with no cropping
    text = page.extract_text(x_tolerance=3, y_tolerance=3)
    print('Full page text (first 500):', repr(text[:500] if text else 'EMPTY'))

    # Now try small bboxes relative to the page's own coordinate space
    print()
    print('Testing crop within page.bbox...')
    x0_page, top_page, x1_page, bottom_page = page.bbox
    print('page.bbox =', page.bbox)

    # Margin column: left portion
    margin_crop = page.crop((x0_page, top_page + 20, x0_page + 90, bottom_page - 20))
    mt = margin_crop.extract_text(x_tolerance=3, y_tolerance=3)
    print('Margin text:', repr(mt[:300] if mt else 'EMPTY'))

    print()
    # Main text column
    main_crop = page.crop((x0_page + 90, top_page + 20, x1_page, bottom_page - 20))
    mtxt = main_crop.extract_text(x_tolerance=3, y_tolerance=3)
    print('Main text:', repr(mtxt[:500] if mtxt else 'EMPTY'))
