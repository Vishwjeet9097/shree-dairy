
import React, { useState } from 'react';
import { X, Download, Share2, MessageCircle } from 'lucide-react';
import { InvoiceData } from '../types';
import { createInvoicePDF, saveInvoice, shareInvoice } from '../services/invoiceGenerator';
import { Capacitor } from '@capacitor/core';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

const InvoicePreviewModal: React.FC<Props> = ({ isOpen, onClose, data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen || !data) return null;

  // -- HANDLERS --

  const handleDownload = async () => {
      setIsGenerating(true);
      try {
          const doc = await createInvoicePDF(data);
          const filename = `Invoice_${data.invoiceNumber}.pdf`;
          await saveInvoice(doc, filename);
          
          if (Capacitor.isNativePlatform()) {
             setStatusMsg('Saved to Documents');
             setTimeout(() => setStatusMsg(''), 3000);
          }
      } catch (error) {
          console.error(error);
          setStatusMsg('Error saving');
      } finally {
          setIsGenerating(false);
      }
  };

  const handleWhatsAppShare = () => {
      if (!data.customer.phone) {
          setStatusMsg('No phone number');
          setTimeout(() => setStatusMsg(''), 2000);
          return;
      }

      const text = `🧾 Invoice for ${data.customer.name}

Month: ${data.items[0].description}
Total Quantity: ${data.items[0].qty}
Current Bill: ₹${data.totals.subtotal}
Previous Due: ₹${data.totals.previousDue}

*Grand Total: ₹${data.totals.grandTotal}*

Please pay by ${data.dueDate}.
From: ${data.businessDetails.businessName}`;

      const url = `https://wa.me/91${data.customer.phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
       {/* Modal Container */}
       <div className="bg-white dark:bg-gray-900 w-full max-w-lg max-h-[90vh] h-full rounded-[2rem] shadow-2xl relative flex flex-col ring-1 ring-white/10">
           
           {/* Header */}
           <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 shrink-0 z-10 rounded-t-[2rem]">
               <div>
                   <h2 className="text-lg font-bold text-gray-900 dark:text-white font-hindi">Invoice Preview</h2>
                   <p className="text-xs text-gray-500">{data.invoiceNumber}</p>
               </div>
               <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                   <X size={20} className="text-gray-600 dark:text-gray-300" />
               </button>
           </div>

           {/* Scrollable Content Area with Darker Background for Contrast */}
           <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-200 dark:bg-black/50 p-6 custom-scrollbar">
                
                {/* PDF Paper Representation */}
                <div className="bg-white text-gray-900 p-8 shadow-2xl min-h-[600px] text-sm relative mb-24 mx-auto max-w-full border border-gray-300 ring-4 ring-gray-100 dark:ring-gray-800/50"> 
                    
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start mb-10 pb-6 border-b border-gray-100">
                        <div>
                            <h1 className="text-4xl font-bold text-red-600 tracking-wide font-hindi leading-tight">
                                {data.businessDetails.businessNameHi || "श्री"}
                            </h1>
                            <p className="text-gray-500 text-[11px] mt-1 uppercase tracking-widest font-bold">{data.businessDetails.businessName}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Invoice #</p>
                            <p className="font-bold text-lg text-gray-800">{data.invoiceNumber}</p>
                            <div className="mt-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase mr-2">Due Date</span>
                                <span className="text-xs text-red-600 font-bold">{data.dueDate}</span>
                            </div>
                        </div>
                    </div>

                    {/* Address Grid */}
                    <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
                        <div className="flex-1">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Bill To</h3>
                            <p className="font-bold font-hindi text-lg text-gray-900 mb-1">{data.customer.name}</p>
                            <p className="text-gray-600 text-sm mb-1">+91 {data.customer.phone}</p>
                            <p className="text-gray-600 text-sm leading-relaxed max-w-[180px]">{data.customer.address}</p>
                        </div>
                        <div className="flex-1 sm:text-right">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">From</h3>
                            <p className="font-bold text-lg text-gray-900 mb-1">{data.businessDetails.ownerName}</p>
                            <p className="text-gray-600 text-sm leading-relaxed mb-1">{data.businessDetails.address}</p>
                            <p className="text-gray-600 text-sm">+91 {data.businessDetails.phone}</p>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="border border-gray-200 rounded-none overflow-hidden mb-8">
                        <table className="w-full text-left min-w-[300px]">
                            <thead className="bg-lime-500 text-white text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="p-3 font-bold">Item Description</th>
                                    <th className="p-3 text-right font-bold">Rate</th>
                                    <th className="p-3 text-right font-bold">Qty</th>
                                    <th className="p-3 text-right font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs">
                                {data.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50">
                                        <td className="p-3 font-medium text-gray-700">{item.description}</td>
                                        <td className="p-3 text-right text-gray-500">{item.rate}</td>
                                        <td className="p-3 text-right text-gray-500">{item.qty}</td>
                                        <td className="p-3 text-right font-bold text-gray-900">{Math.round(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-12">
                        <div className="w-full max-w-[240px] space-y-3">
                            <div className="flex justify-between text-xs font-medium text-gray-500">
                                <span>Current Bill</span>
                                <span className="text-gray-900 font-bold">{data.totals.subtotal.toFixed(0)}</span>
                            </div>
                            {data.totals.previousDue !== 0 && (
                                <div className="flex justify-between text-xs font-medium text-gray-500">
                                    <span>{data.totals.previousDue > 0 ? 'Previous Due' : 'Advance'}</span>
                                    <span className={`font-bold ${data.totals.previousDue > 0 ? 'text-gray-900' : 'text-green-600'}`}>
                                        {data.totals.previousDue > 0 ? '' : '- '}{Math.abs(data.totals.previousDue).toFixed(0)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-xs font-medium text-red-500">
                                <span>Paid Amount</span>
                                <span>- {data.totals.paid.toFixed(0)}</span>
                            </div>
                            <div className="border-t-2 border-gray-100 pt-3 flex justify-between items-center">
                                <span className="text-sm font-bold text-lime-600 uppercase tracking-wide">Total Payable</span>
                                <span className="text-xl font-bold text-gray-900">₹{data.totals.grandTotal.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Thank you for your business!</p>
                        <p className="text-[9px] text-gray-300 mt-1">Generated by Shree Dairy Manager</p>
                    </div>
                </div>
           </div>

           {/* Actions - Fixed Bottom */}
           <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 rounded-b-[2rem]">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {data.customer.phone ? (
                        <button 
                            onClick={handleWhatsAppShare}
                            className="py-3.5 rounded-xl bg-[#25D366] text-white font-bold flex items-center justify-center gap-2 hover:bg-[#128C7E] transition-colors shadow-lg active:scale-95"
                        >
                            <MessageCircle size={18} fill="currentColor" />
                            WhatsApp Bill
                        </button>
                    ) : (
                        <button 
                            disabled
                            className="py-3.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-400 font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                            <MessageCircle size={18} />
                            No Phone
                        </button>
                    )}

                    <button 
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="py-3.5 rounded-xl bg-gray-900 dark:bg-gray-700 text-white font-bold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors shadow-lg shadow-gray-200 dark:shadow-none active:scale-95"
                    >
                        <Download size={18} />
                        Download PDF
                    </button>
                </div>
                {statusMsg && (
                    <div className="text-center text-xs font-bold text-lime-600 dark:text-lime-400 animate-pulse">
                        {statusMsg}
                    </div>
                )}
           </div>
       </div>
    </div>
  );
};

export default InvoicePreviewModal;
