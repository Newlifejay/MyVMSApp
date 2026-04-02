'use client';
import { Printer } from 'lucide-react';

interface PrintBadgeProps {
  visitor: any;
  orgName: string;
  orgLogo: string;
}

export default function PrintBadgeButton({ visitor, orgName, orgLogo }: PrintBadgeProps) {
  const handlePrint = () => {
    // Open a popup formatted perfectly for a 3x4 Badge Printer
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Badge - ${visitor.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; background: #fff; }
            .badge { width: 3in; height: 4in; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center; box-sizing: border-box; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .org { font-size: 14px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; color: #4b5563; }
            .logo { max-width: 120px; max-height: 40px; margin-bottom: 10px; object-fit: contain; }
            .photo-container { margin-bottom: 20px; display: flex; justify-content: center; }
            .photo { width: 140px; height: 140px; object-fit: cover; border-radius: 50%; border: 4px solid #f3f4f6; }
            .photo-fallback { width: 140px; height: 140px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f3f4f6; font-size: 48px; color: #9ca3af; font-weight: bold; border: 4px solid #e5e7eb; }
            .name { font-size: 24px; font-weight: 900; margin: 0 0 5px; color: #111827; }
            .company { font-size: 16px; color: #6b7280; font-weight: 600; margin: 0 0 15px; }
            .role { font-size: 18px; font-weight: bold; background: #111827; color: #fff; padding: 6px 20px; border-radius: 50px; display: inline-block; margin-top: auto; position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); }
            @media print {
               @page { size: 3in 4in; margin: 0; }
               body { padding: 0; background: none; }
               .badge { border: none; box-shadow: none; border-radius: 0; }
            }
          </style>
        </head>
        <body>
          <div class="badge">
            ${orgLogo ? `<img src="${orgLogo}" class="logo" />` : ''}
            ${!orgLogo && orgName ? `<div class="org">${orgName}</div>` : ''}
            
            <div class="photo-container">
               ${visitor.photo_url 
                  ? `<img src="${visitor.photo_url}" class="photo" />` 
                  : `<div class="photo-fallback">${visitor.name.charAt(0)}</div>`
               }
            </div>
            
            <div class="name">${visitor.name}</div>
            <div class="company">${visitor.company || 'Visitor'}</div>
            <div class="role">VISITOR</div>
          </div>
          <script>
            // Wait for images to load before firing print
            setTimeout(() => { window.print(); }, 800);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button 
      onClick={handlePrint} 
      className="p-2 ml-4 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg hover:bg-[var(--primary)] hover:text-white transition flex items-center justify-center shadow-sm font-medium" 
      title="Print Visitor Badge"
    >
      <Printer size={18} className="mr-2" /> Print
    </button>
  );
}
