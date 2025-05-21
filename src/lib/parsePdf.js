async function parsePdf(buffer) {

    const pdfjsLib = eval('require("pdfjs-dist/legacy/build/pdf")')

    const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        disableWorker: true,
    }).promise


    let fullText = ''

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const content = await page.getTextContent()
        const strings = content.items.map(item => item.str)
        fullText += strings.join(' ') + '\n'
    }

    return fullText
}

module.exports = { parsePdf }
