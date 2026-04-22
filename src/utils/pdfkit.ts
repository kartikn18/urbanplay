import PDFDocument from 'pdfkit';
import cloudinary from '../config/cloudinary';
export const generateReceipt = async (data: {
    bookingId: number;
    turfName: string;
    slotTime: Date;
    amount: number;
    paymentId: string;
    userEmail: string;
}): Promise<string> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('error', reject);
        doc.on('end', async () => {
            try {
                const pdfBuffer = Buffer.concat(buffers) ;

                // Upload PDF to Cloudinary
                const result = await new Promise<any>((res, rej) => {
                    cloudinary.uploader.upload_stream(
                        {
                            folder: 'receipts',
                            resource_type: 'raw',
                            format: 'pdf',
                            public_id: `receipt_${data.bookingId}_${Date.now()}`
                        },
                        (err, result) => err ? rej(err) : res(result)
                    );
                });

                resolve(result.secure_url);
            } catch (err) {
                reject(err);
            }
        });

        // ── PDF Content ──
        doc.fontSize(22).font('Helvetica-Bold')
           .text('TURF BOOKING RECEIPT', { align: 'center' });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(12).font('Helvetica');
        doc.text(`Booking ID:`, { continued: true })
           .font('Helvetica-Bold').text(` #${data.bookingId}`);

        doc.font('Helvetica')
           .text(`Payment ID:`, { continued: true })
           .font('Helvetica-Bold').text(` ${data.paymentId}`);

        doc.moveDown();
        doc.font('Helvetica').text(`Turf:`, { continued: true })
           .font('Helvetica-Bold').text(` ${data.turfName}`);

        doc.font('Helvetica').text(`Slot Time:`, { continued: true })
           .font('Helvetica-Bold')
           .text(` ${new Date(data.slotTime).toLocaleString('en-IN')}`);

        doc.font('Helvetica').text(`Email:`, { continued: true })
           .font('Helvetica-Bold').text(` ${data.userEmail}`);

        doc.font('Helvetica').text(`Date:`, { continued: true })
           .font('Helvetica-Bold')
           .text(` ${new Date().toLocaleString('en-IN')}`);

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        doc.fontSize(16).font('Helvetica-Bold')
           .text(`Amount Paid: ₹${data.amount / 100}`, { align: 'right' });

        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica')
           .text('Thank you for booking with us!', { align: 'center' });

        doc.end();
    });
};