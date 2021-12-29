const { Blob } = require('formdata-node');
const Jimp = require('jimp');

async function generateAktaNikah(url1, name1, url2, name2) {
    try {
        console.log('Generating akta nikah...');
        const start = new Date().getTime();

        const targetImage1 = await Jimp.read(url1);
        targetImage1.resize(146, 146);

        const targetImage2 = await Jimp.read(url2);
        targetImage2.resize(146, 146);

        const templateImage = await Jimp.read('./assets/images/template_akta_nikah.png');
        templateImage.composite(targetImage1, 90, 462);
        templateImage.composite(targetImage2, 274, 462);

        const font = await Jimp.loadFont('./assets/fonts/darleston_30_bold_2f2f2f.fnt');

        templateImage.print(
            font,
            0,
            250,
            {
                text: `${name1} & ${name2}`,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
                alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
            },
            512,
            32
        );

        return templateImage.getBufferAsync(Jimp.MIME_PNG).then((buffer) => {
            const end = new Date().getTime();
            console.log("Generate akta nikah finished in " + (end - start) + "ms");
            return new Blob([buffer.buffer], { type: Jimp.MIME_PNG });
        });
    } catch (error) {
        console.log('Error when generating akta nikah image.');
        console.error(error);
    }
}

module.exports = { generateAktaNikah: generateAktaNikah }