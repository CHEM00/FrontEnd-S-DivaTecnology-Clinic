import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateConsentPDF(
    patientName: string,
    therapistName: string,
    signatureImageBase64: string,
    initials: string
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage();
    const { width, height } = currentPage.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 10;
    const titleSize = 14;
    const margin = 50;
    let yPosition = height - margin;

    const drawText = (text: string, size: number = fontSize, isBold: boolean = false, align: 'left' | 'center' = 'left') => {
        const currentFont = isBold ? fontBold : font;

        const getX = (txt: string) => {
            if (align === 'center') {
                const txtWidth = currentFont.widthOfTextAtSize(txt, size);
                return (width - txtWidth) / 2;
            }
            return margin;
        };

        // Simple word wrapping
        const maxWidth = width - (margin * 2);
        const textWidth = currentFont.widthOfTextAtSize(text, size);

        if (textWidth > maxWidth) {
            const words = text.split(' ');
            let line = '';
            for (const word of words) {
                const testLine = line + word + ' ';
                const testWidth = currentFont.widthOfTextAtSize(testLine, size);
                if (testWidth > maxWidth) {
                    // Check page break for text lines
                    if (yPosition < margin) {
                        currentPage = pdfDoc.addPage();
                        yPosition = currentPage.getSize().height - margin;
                    }
                    currentPage.drawText(line, { x: getX(line), y: yPosition, size, font: currentFont, color: rgb(0, 0, 0) });
                    yPosition -= (size + 4);
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            // Check page break for last line
            if (yPosition < margin) {
                currentPage = pdfDoc.addPage();
                yPosition = currentPage.getSize().height - margin;
            }
            currentPage.drawText(line, { x: getX(line), y: yPosition, size, font: currentFont, color: rgb(0, 0, 0) });
        } else {
            // Check page break for single line
            if (yPosition < margin) {
                currentPage = pdfDoc.addPage();
                yPosition = currentPage.getSize().height - margin;
            }
            currentPage.drawText(text, { x: getX(text), y: yPosition, size, font: currentFont, color: rgb(0, 0, 0) });
        }
        yPosition -= (size + 6);
    };

    const addVerticalSpace = (space: number) => {
        yPosition -= space;
    };

    // --- Header ---
    drawText('DOCUMENTO DE CONSENTIMIENTO INFORMADO Y TÉRMINOS DEL SERVICIO', titleSize, true, 'center');
    addVerticalSpace(10);
    drawText(`CLÍNICA: JessTherapy`, fontSize, true);
    drawText(`RESPONSABLE SANITARIO: ${therapistName}`, fontSize, true);
    // drawText(`CÉDULA PROFESIONAL: [Número]`, fontSize, true); // Optional if not provided
    addVerticalSpace(10);

    // --- Content ---
    drawText('1. DECLARACIÓN DEL PACIENTE', fontSize, true);
    drawText(`Yo, ${patientName}, declaro que he solicitado servicios de fisioterapia en JessTherapy. Entiendo que la fisioterapia implica el uso de medios físicos, terapia manual, terapia invasiva, ondas de choque, ejercicio terapéutico y/o agentes electrofísicos.`);
    addVerticalSpace(5);

    drawText('2. EXPLICACIÓN DEL PROCEDIMIENTO', fontSize, true);
    drawText('Se me ha informado que, tras una valoración inicial, se diseñará un plan de tratamiento que puede incluir: movilizaciones, masoterapia, electroterapia, ultrasonido, láser, terapia invasiva, ondas de choque, termoterapia y ejercicio terapéutico.');
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
    drawText('• C) Política de Asistencia: En caso de faltar a la cita o no cancelar con al menos 3 horas de anticipación, se cobrará una multa de $150.00 MXN en la próxima sesión.');
    drawText('• D) Costos Adicionales: Si durante la terapia fuera necesaria la aplicación de insumos o servicios con costo extra adicionales, se consultará y solicitará la conformidad del paciente antes de su aplicación.');
    drawText('• E) Duración y Puntualidad: Las sesiones tienen una duración de 50 minutos. Cualquier retraso por parte del paciente no extenderá el horario programado, recibiendo tratamiento solo por el tiempo restante.');
    addVerticalSpace(5);

    drawText('7. VERACIDAD Y VALIDEZ DE FIRMA', fontSize, true);
    drawText('Declaro que la información de mi historia clínica es verdadera. Acepto firmar este documento mediante medios electrónicos, reconociendo que mi firma digital tiene plena validez legal y vinculante igual a la manuscrita.');
    addVerticalSpace(10);

    drawText('CONFIRMACIÓN Y ACEPTACIÓN', fontSize, true, 'center');
    drawText('Habiendo leído la información médica y las condiciones administrativas (incluyendo la política de no reembolso), OTORGO MI CONSENTIMIENTO.', fontSize, false, 'center');
    addVerticalSpace(20);

    // --- Signature Section ---
    const signatureWidth = 200;
    const signatureX = (width - signatureWidth) / 2;

    // Embed signature image
    if (signatureImageBase64) {
        try {
            const pngImage = await pdfDoc.embedPng(signatureImageBase64);
            const pngDims = pngImage.scale(0.5);

            // Check if we have space, if not add page
            if (yPosition < 150) {
                currentPage = pdfDoc.addPage();
                yPosition = currentPage.getSize().height - margin;
            }

            currentPage.drawImage(pngImage, {
                x: signatureX,
                y: yPosition - 60,
                width: signatureWidth,
                height: 60,
            });
        } catch (e) {
            console.error("Error embedding signature", e);
            drawText('[Error al adjuntar firma]', fontSize, false, 'center');
        }
    }

    // Draw lines and text for signature
    currentPage.drawLine({
        start: { x: signatureX, y: yPosition - 60 },
        end: { x: signatureX + signatureWidth, y: yPosition - 60 },
        thickness: 1,
        color: rgb(0, 0, 0),
    });

    yPosition -= 75;
    drawText(`Firma del Paciente / Tutor Legal`, fontSize, true, 'center');
    drawText(`Nombre Completo: ${patientName}`, fontSize, false, 'center');
    drawText(`Iniciales: ${initials}`, fontSize, false, 'center');
    drawText(`Fecha: ${new Date().toLocaleDateString()}`, fontSize, false, 'center');

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
