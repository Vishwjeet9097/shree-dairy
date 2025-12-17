
import React, { useState } from 'react';
import { X, Download, Share2, FileText, Send, MessageCircle } from 'lucide-react';
import { InvoiceData } from '../types';
import { createInvoicePDF, saveInvoice, saveToCache } from '../services/invoiceGenerator';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

const InvoicePreviewModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen || !data) return null;

  const hasPhone = data.customer.phone && data.customer.phone.trim().length > 0;

  // -- HANDLERS --

  const handleDownload = async () => {
      setIsGenerating(true);
      try {
          const doc = await createInvoicePDF(data);
          const filename = `Invoice_${data.invoiceNumber}.pdf`;
          
          if (Capacitor.isNativePlatform()) {
             const uri = await saveToCache(doc, filename);
             await Share.share({
                files: [uri],
             });
             setStatusMsg('File Saved');
          } else {
             await saveInvoice(doc, filename);
             setStatusMsg('Downloaded');
          }
      } catch (error) {
          console.error(error);
          setStatusMsg('Error saving');
      } finally {
          setIsGenerating(false);
          setTimeout(() => setStatusMsg(''), 3000);
      }
  };

  const handleSharePDF = async () => {
      setIsGenerating(true);
      try {
          const doc = await createInvoicePDF(data);
          const filename = `Invoice_${data.invoiceNumber}.pdf`;
          const uri = await saveToCache(doc, filename);
          
          await Share.share({
              title: `Invoice ${data.invoiceNumber}`,
              text: `Invoice for ${data.customer.name}`,
              files: [uri], 
              dialogTitle: 'Share Invoice PDF'
          });
      } catch (e) {
          console.error(e);
          setStatusMsg('Share failed');
      } finally {
          setIsGenerating(false);
      }
  };

  const handleWhatsAppText = () => {
      if (!hasPhone) {
          setStatusMsg('No Phone Number');
          return;
      }
      
      const text = `
*Invoice Summary*
Hello ${data.customer.name}, here is your milk bill details:

*Month:* ${new Date(data.date).toLocaleString('default', { month: 'long', year: 'numeric' })}
*Total Milk:* ${data.items.reduce((acc, i) => acc + parseFloat(i.qty), 0)} kg
*Current Bill:* ₹${data.totals.subtotal}
*Previous Due:* ₹${data.totals.previousDue}
*Paid:* -₹${data.totals.paid}

*Grand Total Due: ₹${data.totals.grandTotal}*

Please pay at your earliest convenience.
- ${data.businessDetails.businessName}
      `.trim();

      const url = `https://wa.me/91${data.customer.phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
       {/* Modal Container */}
       <div className="bg-gray-100 dark:bg-gray-900 w-full max-w-lg h-[90vh] rounded-[2.5rem] shadow-2xl relative flex flex-col overflow-hidden ring-1 ring-white/10">
           
           {/* Header */}
           <div className="px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0 z-20 absolute top-0 left-0 right-0">
               <div>
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white font-hindi">Invoice Preview</h2>
                   <p className="text-xs text-gray-500 font-mono">{data.invoiceNumber}</p>
               </div>
               <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                   <X size={20} className="text-gray-600 dark:text-gray-300" />
               </button>
           </div>

           {/* Scrollable Content Area */}
           <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 custom-scrollbar bg-gray-200 dark:bg-black/50">
                
                {/* PDF Paper Effect */}
                <div className="bg-white text-gray-900 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.15)] relative mx-auto max-w-full rounded-sm min-h-[500px]"> 
                    
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none overflow-hidden">
                        <span className="text-[150px] font-bold text-red-600 rotate-[-30deg] font-hindi">श्री</span>
                    </div>

                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-8 border-b-2 border-lime-500 pb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-red-600 font-hindi tracking-wide leading-none mb-2">
                                {data.businessDetails.businessNameHi || "श्री"}
                            </h1>
                            <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">{data.businessDetails.businessName}</p>
                            <div className="mt-4 text-xs text-gray-500">
                                <p>{data.businessDetails.address}</p>
                                <p>Ph: +91 {data.businessDetails.phone}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="bg-lime-50 text-lime-800 px-3 py-1 rounded-md inline-block mb-2">
                                <p className="text-[10px] font-extrabold uppercase tracking-widest">Invoice No</p>
                                <p className="font-bold text-sm font-mono">{data.invoiceNumber}</p>
                            </div>
                            <div className="text-xs text-gray-500">
                                <p><span className="font-bold">Date:</span> {data.date}</p>
                                <p className="text-red-500 mt-1"><span className="font-bold">Due:</span> {data.dueDate}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Bill To</p>
                        <h3 className="font-bold text-lg text-gray-900 font-hindi">{data.customer.name}</h3>
                        {data.customer.address && <p className="text-xs text-gray-500">{data.customer.address}</p>}
                        {data.customer.phone && <p className="text-xs text-gray-500 font-mono mt-1">+91 {data.customer.phone}</p>}
                    </div>

                    {/* Item Table */}
                    <div className="mb-8">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="py-2 text-xs font-bold text-gray-500 uppercase">Item</th>
                                    <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right">Rate</th>
                                    <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right">Qty</th>
                                    <th className="py-2 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {data.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 last:border-0">
                                        <td className="py-3 font-medium text-gray-800">{item.description}</td>
                                        <td className="py-3 text-right text-gray-500">{item.rate}</td>
                                        <td className="py-3 text-right text-gray-500">{item.qty}</td>
                                        <td className="py-3 text-right font-bold text-gray-900">₹{Math.round(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Calculations */}
                    <div className="flex justify-end">
                        <div className="w-1/2 min-w-[200px] space-y-2">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Subtotal</span>
                                <span className="font-bold text-gray-900">₹{data.totals.subtotal}</span>
                            </div>
                            {data.totals.previousDue !== 0 && (
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{data.totals.previousDue > 0 ? 'Previous Due' : 'Advance Credit'}</span>
                                    <span className={`${data.totals.previousDue > 0 ? 'text-gray-900' : 'text-green-600'} font-bold`}>
                                        {data.totals.previousDue > 0 ? '+' : '-'} ₹{Math.abs(data.totals.previousDue)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs text-red-500">
                                <span>Paid Amount</span>
                                <span className="font-bold">- ₹{data.totals.paid}</span>
                            </div>
                            <div className="border-t-2 border-gray-900 pt-3 mt-3 flex justify-between items-center">
                                <span className="text-sm font-bold uppercase tracking-wide">Total Due</span>
                                <span className="text-2xl font-bold text-lime-600">₹{data.totals.grandTotal}</span>
                            </div>
                        </div>
                    </div>

                    {/* Signature Area */}
                    <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-end">
                        <div className="text-[10px] text-gray-400">
                            Generated via Shree App
                        </div>
                        <div className="text-center">
                            <div className="h-10"></div> {/* Space for signature */}
                            <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest border-t border-gray-300 pt-1 px-4">Authorized Signature</p>
                        </div>
                    </div>
                </div>
           </div>

           {/* Actions Footer */}
           <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-30 pb-safe-area">
                <div className="flex gap-2">
                    {/* WhatsApp Text Button */}
                    {hasPhone && (
                        <button 
                            onClick={handleWhatsAppText}
                            className="flex-1 py-3.5 rounded-2xl bg-green-100 text-green-800 font-bold flex items-center justify-center gap-2 hover:bg-green-200 transition-colors active:scale-95"
                        >
                            <MessageCircle size={18} />
                            <span className="text-xs">Send Text</span>
                        </button>
                    )}

                    {/* Share PDF Button */}
                    <button 
                        onClick={handleSharePDF}
                        disabled={isGenerating}
                        className="flex-[2] py-3.5 rounded-2xl bg-lime-400 text-gray-900 hover:bg-lime-500 font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-lime-200/50 dark:shadow-none active:scale-95 disabled:opacity-50"
                    >
                        {isGenerating ? <FileText size={18} className="animate-bounce"/> : <Share2 size={18} />}
                        Share PDF
                    </button>

                    {/* Download Button */}
                    <button 
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="p-3.5 rounded-2xl bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors active:scale-95"
                    >
                        <Download size={20} />
                    </button>
                </div>
                
                {statusMsg && (
                    <div className="text-center text-[10px] font-bold text-gray-500 mt-2 animate-pulse">
                        {statusMsg}
                    </div>
                )}
           </div>
       </div>
    </div>
  );
};

export default InvoicePreviewModal;
