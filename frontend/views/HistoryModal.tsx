import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrderItem {
  id?: number;
  ring_id: number;
  ring_identifier: string;
  ring_name: string;
  material: string;
  size: string;
  quantity: number;
  price: number;
  image_url: string;
}

interface Order {
  id: number;
  order_number: string;
  user_id: number;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  shipping_address?: string;
  shipping_name?: string;
  shipping_phone?: string;
  created_at: string;
  items?: OrderItem[];
  user?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(savedDarkMode);
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Load from localStorage
      const savedOrders = localStorage.getItem('purchase_history');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForPDF = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'confirmed': return 'bg-purple-500';
      case 'processing': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Download receipt as PDF
  const downloadReceipt = async (order: Order) => {
    setDownloading(true);
    
    // Create a temporary div for the receipt
    const receiptElement = document.createElement('div');
    receiptElement.style.width = '800px';
    receiptElement.style.padding = '40px';
    receiptElement.style.backgroundColor = 'white';
    receiptElement.style.fontFamily = 'Arial, sans-serif';
    receiptElement.style.position = 'absolute';
    receiptElement.style.left = '-9999px';
    receiptElement.style.top = '-9999px';
    
    receiptElement.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #ff2aa2; padding-bottom: 20px; margin-bottom: 30px;">
          <div style="font-size: 48px; color: #ff2aa2;">💎</div>
          <h1 style="color: #ff2aa2; margin: 10px 0 5px; font-size: 28px;">BondKeeper</h1>
          <p style="color: #666; margin: 0;">Eternal Rings, Eternal Story</p>
        </div>

        <!-- Receipt Title -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #333; margin: 0;">PURCHASE RECEIPT</h2>
          <p style="color: #666; margin: 5px 0 0;">Order #${order.order_number}</p>
        </div>

        <!-- Order Info -->
        <div style="margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Order Date:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${formatDateForPDF(order.created_at)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Order Status:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #ff2aa2;">${getStatusText(order.order_status)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Payment Method:</td>
              <td style="padding: 8px 0; text-align: right; font-weight: bold;">${order.payment_method}</td>
            </tr>
          </table>
        </div>

        <!-- Customer Info -->
        <div style="margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; color: #666;">Name:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">${order.shipping_name || order.user?.full_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Email:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">${order.user?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Phone:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">${order.shipping_phone || order.user?.phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #666;">Address:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: bold;">${order.shipping_address || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Items Purchased</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0;">Item</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e0e0e0;">Size</th>
                <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e0e0e0;">Qty</th>
                <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map(item => `
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">
                    <strong>${item.ring_name}</strong><br>
                    <small style="color: #666;">${item.material} • ${item.ring_identifier}</small>
                  </td>
                  <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e0e0e0;">${item.size}</td>
                  <td style="padding: 12px; text-align: center; border-bottom: 1px solid #e0e0e0;">${item.quantity}</td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e0e0e0;">$${item.price.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Total -->
        <div style="text-align: right; margin-bottom: 30px;">
          <table style="width: 300px; margin-left: auto; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666;">Subtotal:</td>
              <td style="padding: 8px 0; text-align: right;">$${order.subtotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Shipping:</td>
              <td style="padding: 8px 0; text-align: right;">$${order.shipping_cost}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Tax:</td>
              <td style="padding: 8px 0; text-align: right;">$${order.tax}</td>
            </tr>
            <tr style="border-top: 2px solid #ff2aa2;">
              <td style="padding: 12px 0 0; font-size: 18px; font-weight: bold;">Total:</td>
              <td style="padding: 12px 0 0; text-align: right; font-size: 24px; font-weight: bold; color: #ff2aa2;">$${order.total.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <!-- Footer -->
        <div style="text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 20px;">
          <p style="color: #999; font-size: 12px; margin: 5px 0;">Thank you for your purchase!</p>
          <p style="color: #999; font-size: 12px; margin: 5px 0;">Your bond is now forever registered with BondKeeper.</p>
          <p style="color: #999; font-size: 12px; margin: 5px 0;">For any questions, contact: support@bondkeeper.com</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(receiptElement);
    
    try {
      const canvas = await html2canvas(receiptElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Receipt_${order.order_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      document.body.removeChild(receiptElement);
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div 
          className={`relative w-full max-w-4xl bg-white dark:bg-charcoal rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'dark' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-charcoal border-b border-primary/10 p-6 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
              <div>
                <h2 className="heading-serif text-2xl font-semibold text-black-600 dark:text-pink-900">Purchase History</h2>
                {orders.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-pink-800 dark:hover:bg-pink-700 flex items-center justify-center transition-colors text-slate-500 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12 bg-pink-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-pink-300 mb-4">receipt</span>
                <h3 className="text-xl font-bold mb-2">No purchase history yet</h3>
                <p className="text-pink-500 mb-6">Your completed purchases will appear here</p>
                <button
                  onClick={onClose}
                  className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/80 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : selectedOrder ? (
              // Detailed Receipt View
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center gap-2 text-primary hover:underline mb-4"
                  >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back to History
                  </button>
                  
                  {/* Download Button */}
                  <button
                    onClick={() => downloadReceipt(selectedOrder)}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {downloading ? 'hourglass_empty' : 'download'}
                    </span>
                    {downloading ? 'Generating...' : 'Download Receipt (PDF)'}
                  </button>
                </div>

                {/* Receipt Card */}
                <div className="bg-slate-50 dark:bg-pink-100 rounded-2xl p-6 border border-primary/10">
                  {/* Receipt Header */}
                  <div className="border-b border-primary/10 pb-4 mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-black-600 dark:text-pink-900">Receipt #{selectedOrder.order_number}</h3>
                        <p className="text-sm text-pink-500">{formatDate(selectedOrder.created_at)}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getStatusColor(selectedOrder.order_status)}`}>
                        {getStatusText(selectedOrder.order_status)}
                      </div>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="mb-6 p-4 bg-primary/5 rounded-xl">
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-primary ">person</span>
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-pink-500">
                      <p><span className="text-slate-900">Name:</span> {selectedOrder.shipping_name || selectedOrder.user?.full_name || 'N/A'}</p>
                      <p><span className="text-slate-900">Email:</span> {selectedOrder.user?.email || 'N/A'}</p>
                      <p><span className="text-slate-900">Phone:</span> {selectedOrder.shipping_phone || selectedOrder.user?.phone || 'N/A'}</p>
                      {selectedOrder.shipping_address && (
                        <p className="col-span-2"><span className="text-slate-900">Address:</span> {selectedOrder.shipping_address}</p>
                      )}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h4 className="font-bold mb-3 flex items-center gap-2 text-primary">
                      <span className="material-symbols-outlined text-primary">shopping_bag</span>
                      Items Purchased
                    </h4>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex gap-4 p-3 bg-white dark:bg-charcoal rounded-xl border border-slate-100 text-pink-900">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                            <img src={item.image_url} alt={item.ring_name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{item.ring_name}</p>
                            <p className="text-xs text-slate-500">ID: {item.ring_identifier}</p>
                            <p className="text-xs text-slate-500">{item.material} • Size {item.size}</p>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-sm">Qty: {item.quantity}</p>
                              <p className="text-primary font-bold">${item.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="border-t border-primary/10 pt-4">
                    <div className="space-y-2 text-sm text-pink-500">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subtotal:</span>
                        <span>${selectedOrder.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Shipping:</span>
                        <span>${selectedOrder.shipping_cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tax:</span>
                        <span>${selectedOrder.tax}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary/10 text-primary">
                        <span className="font-bold">Total:</span>
                        <span className="text-2xl font-bold text-primary">${selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">credit_card</span>
                      Paid via {selectedOrder.payment_method}
                    </p>
                    <button
                      onClick={() => downloadReceipt(selectedOrder)}
                      disabled={downloading}
                      className="mt-4 w-full bg-primary/10 text-primary py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Download Receipt (PDF)
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // History List View
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-slate-50 dark:bg-pink-100 rounded-xl p-4 border border-primary/10 hover:border-primary/30 cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-start mb-3 text-pink-900">
                      <div>
                        <p className="font-bold">Order #{order.order_number}</p>
                        <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded-full text-white text-[10px] font-bold ${getStatusColor(order.order_status)}`}>
                          {getStatusText(order.order_status)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadReceipt(order);
                          }}
                          disabled={downloading}
                          className="p-1 hover:bg-primary/10 rounded-lg transition-colors"
                          title="Download Receipt"
                        >
                          <span className="material-symbols-outlined text-primary text-sm">download</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {order.items?.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white dark:border-charcoal">
                            <img src={item.image_url} alt={item.ring_name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${order.total.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">{order.items?.length || 0} items</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;