import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateConsentPDF(
    patientName: string,
    therapistName: string,
    signatureImageBase64: string,
    initials: string
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 10;
    const titleSize = 14;
    const margin = 50;
    let yPosition = height - margin;

    const drawText = (text: string, size: number = fontSize, isBold: boolean = false, align: 'left' | 'center' = 'left') => {
        const currentFont = isBold ? fontBold : font;
        const textWidth = currentFont.widthOfTextAtSize(text, size);
        let x = margin;
        if (align === 'center') {
            x = (width - textWidth) / 2;
        }

        // Simple word wrapping
        const maxWidth = width - (margin * 2);
        if (textWidth > maxWidth) {
            const words = text.split(' ');
            let line = '';
            for (const word of words) {
                const testLine = line + word + ' ';
                const testWidth = currentFont.widthOfTextAtSize(testLine, size);
                if (testWidth > maxWidth) {
                    page.drawText(line, { x, y: yPosition, size, font: currentFont, color: rgb(0, 0, 0) });
                    yPosition -= (size + 4);
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            page.drawText(line, { x, y: yPosition, size, font: currentFont, color: rgb(0, 0, 0) });
        } else {
            page.drawText(text, { x, y: yPosition, size, font: currentFont, color: rgb(0, 0, 0) });
        }
        yPosition -= (size + 6);
    };

    const addVerticalSpace = (space: number) => {
        yPosition -= space;
    };

    // --- Header ---
    drawText('DOCUMENTO DE CONSENTIMIENTO INFORMADO Y TÉRMINOS DEL SERVICIO', titleSize, true, 'center');
    addVerticalSpace(10);
    drawText(`CLÍNICA: JessTherapy`, fontSize, true); // Hardcoded based on context, or pass as arg
    drawText(`RESPONSABLE SANITARIO: ${localStorage.getItem('firstname') + ' ' + localStorage.getItem('lastname')}`, fontSize, true);
    // drawText(`CÉDULA PROFESIONAL: [Número]`, fontSize, true); // Optional if not provided
    addVerticalSpace(10);

    // --- Content ---
    drawText('1. DECLARACIÓN DEL PACIENTE', fontSize, true);
    drawText(`Yo, ${patientName}, declaro que he solicitado servicios de fisioterapia en JessTherapy. Entiendo que la fisioterapia implica el uso de medios físicos, terapia manual, ejercicio terapéutico y/o agentes electrofísicos.`);
    addVerticalSpace(5);

    drawText('2. EXPLICACIÓN DEL PROCEDIMIENTO', fontSize, true);
    drawText('Se me ha informado que, tras una valoración inicial, se diseñará un plan de tratamiento que puede incluir: movilizaciones, masoterapia, electroterapia, ultrasonido, láser, termoterapia y ejercicio terapéutico.');
    addVerticalSpace(5);

    drawText('3. RIESGOS Y BENEFICIOS', fontSize, true);
    drawText('Entiendo los riesgos inherentes (dolor muscular temporal, hematomas leves, irritación cutánea) y los beneficios esperados (mejora funcional, disminución del dolor).');
    addVerticalSpace(5);

    drawText('4. REVOCACIÓN Y DERECHOS', fontSize, true);
    drawText('Entiendo que puedo revocar este consentimiento médico en cualquier momento, deteniendo el tratamiento clínico sin que ello afecte a mi atención futura.');
    addVerticalSpace(5);

    drawText('5. PROTECCIÓN DE DATOS', fontSize, true);
    drawText('Autorizo el tratamiento de mis datos personales y de salud con fines asistenciales y administrativos conforme a la ley vigente.');
    addVerticalSpace(5);

    drawText('6. CLÁUSULA DE PAQUETES, BONOS Y POLÍTICA DE CANCELACIÓN (IMPORTANTE)', fontSize, true);
    drawText('En caso de que el paciente decida adquirir un paquete o bono de sesiones de tratamiento por adelantado para obtener un precio preferencial, acepta expresamente las siguientes condiciones:');
    drawText('• A) Intransferibilidad: Los paquetes de sesiones son personales e intransferibles. Bajo ningún concepto podrán ser cedidos, donados, ni utilizados por familiares, amigos o terceras personas distintas al paciente firmante.');
    drawText('• B) No Reembolso por Abandono: Si el paciente decide unilateralmente no concluir su tratamiento o abandona las sesiones restantes del paquete adquirido, no se realizarán reembolsos económicos (ni totales ni parciales) por las sesiones no consumidas.');
    addVerticalSpace(5);

    drawText('7. VERACIDAD Y VALIDEZ DE FIRMA', fontSize, true);
    drawText('Declaro que la información de mi historia clínica es verdadera. Acepto firmar este documento mediante medios electrónicos, reconociendo que mi firma digital tiene plena validez legal y vinculante igual a la manuscrita.');
    addVerticalSpace(10);

    drawText('CONFIRMACIÓN Y ACEPTACIÓN', fontSize, true, 'center');
    drawText('Habiendo leído la información médica y las condiciones administrativas (incluyendo la política de no reembolso), OTORGO MI CONSENTIMIENTO.', fontSize, false, 'center');
    addVerticalSpace(20);

    // --- Signature Section ---
    // Embed signature image
    if (signatureImageBase64) {
        try {
            const pngImage = await pdfDoc.embedPng(signatureImageBase64);
            const pngDims = pngImage.scale(0.5);

            // Check if we have space, if not add page
            if (yPosition < 150) {
                const newPage = pdfDoc.addPage();
                yPosition = newPage.getSize().height - margin;
            }

            page.drawImage(pngImage, {
                x: margin,
                y: yPosition - 60,
                width: 200,
                height: 60,
            });
        } catch (e) {
            console.error("Error embedding signature", e);
            drawText('[Error al adjuntar firma]', fontSize, false);
        }
    }

    // Draw lines and text for signature
    page.drawLine({
        start: { x: margin, y: yPosition - 60 },
        end: { x: margin + 200, y: yPosition - 60 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    yPosition -= 75;
    drawText(`Firma del Paciente / Tutor Legal`, fontSize, true);
    drawText(`Nombre Completo: ${patientName}`, fontSize);
    drawText(`Iniciales: ${initials}`, fontSize);
    drawText(`Fecha: ${new Date().toLocaleDateString()}`, fontSize);

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
