import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentPreviewProps {
  doc: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentPreview({ doc, open, onOpenChange }: DocumentPreviewProps) {
  if (!doc) return null;

  const paperRef = useRef<HTMLDivElement | null>(null);
  const [paperWidth, setPaperWidth] = useState(595);
  const items = doc.content?.items || [];
  const subtotal = doc.content?.subtotal || 0;
  const laborCost = doc.content?.labor_cost || 0;
  const total = doc.content?.total || 0;
  const docDate = doc.content?.document_date
    ? new Date(doc.content.document_date)
    : new Date(doc.created_at);
  const dateStr = format(docDate, "dd/MM/yyyy");
  const isInvoice = doc.document_type === "invoice";

  const minRows = 10;
  const emptyRows = Math.max(0, minRows - items.length);

  const formatGroupedNumber = (value: number) =>
    Number(value || 0).toLocaleString("en-US").replace(/,/g, ", ");

  const formatAmount = (amount: number) => {
    const [kwacha, tambala] = amount.toFixed(2).split(".");
    return { kwacha: formatGroupedNumber(Number(kwacha)), tambala };
  };

  useEffect(() => {
    const node = paperRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateWidth = (width: number) => {
      if (width > 0) {
        setPaperWidth(width);
      }
    };

    updateWidth(node.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        updateWidth(entry.contentRect.width);
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [open]);

  const ptToPx = (pt: number) => (pt * 96) / 72;
  const paperBaseWidth = 595;
  const paperScale = Math.max(0.72, Math.min(1.28, paperWidth / paperBaseWidth));
  const scaleValue = (value: number) => value * paperScale;
  const pageMinHeight = Math.max(842, 842 * paperScale);
  const tableBorderColor = "#1f1f1f";
  const tableBorder = `1px solid ${tableBorderColor}`;
  const tableBlue = "#0f3358";
  const tableHeaderFont = '"Times New Roman", Times, serif';
  const centuryGothicFont = '"Century Gothic", "Trebuchet MS", Arial, sans-serif';
  const calibriFont = '"Calibri", "Segoe UI", Arial, sans-serif';
  const itemFontSize = scaleValue(ptToPx(12));
  const totalMaterialsFontSize = scaleValue(ptToPx(18));
  const laborFontSize = scaleValue(ptToPx(16));
  const netTotalFontSize = scaleValue(ptToPx(18));
  const bodyCellStyle = {
    border: tableBorder,
    padding: `${scaleValue(5)}px ${scaleValue(8)}px`,
    fontFamily: centuryGothicFont,
    fontSize: itemFontSize,
    lineHeight: 1,
    verticalAlign: "middle" as const,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,1100px)] max-w-[1100px] max-h-[92vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Document Preview</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[84vh]">
          <div className="p-6">
            {/* A4-like paper */}
            <div
              ref={paperRef}
              className="bg-white text-black shadow-lg mx-auto border"
              style={{
                width: "100%",
                maxWidth: 760,
                minHeight: pageMinHeight,
                padding: `${scaleValue(16)}px ${scaleValue(24)}px`,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: scaleValue(11),
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>
              {/* Invoice Title Above Header */}
              {isInvoice && (
                <div
                  style={{
                    textAlign: "right",
                    paddingRight: scaleValue(40),
                    marginRight: scaleValue(70),
                    paddingTop: scaleValue(10),
                    marginBottom: scaleValue(5),
                    fontSize: scaleValue(18),
                    color: "#000",
                    fontWeight: "bold",
                    fontFamily: '"Times New Roman", Times, serif',
                  }}
                >
                  INVOICE
                </div>
              )}

              {/* Header image */}
              <div style={{ position: "relative", marginBottom: scaleValue(4) }}>
                <img
                  src="/images/pdf-header.png"
                  alt="Header"
                  style={{ width: "100%", height: "auto" }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: scaleValue(10),
                    right: scaleValue(4),
                    fontSize: scaleValue(14),
                    color: "#000",
                    fontWeight: "bold",
                    letterSpacing: `${scaleValue(0.5)}px`,
                  }}
                >
                  Date: {dateStr}
                </span>
              </div>

              {/* Separator */}
              <div
                style={{
                  // borderBottom: "1.5px solid #1e3a8a",
                  marginBottom: scaleValue(12),
                }}
              />

              {/* Attention To */}
              <div style={{ marginBottom: scaleValue(24), fontSize: scaleValue(14), marginTop: scaleValue(24), marginLeft: scaleValue(12), fontFamily: "Times New Roman", }}>
                <span>Att: {doc.content?.attention_to || ""}</span>
                {/* <span
                  style={{
                    // borderBottom: "1px dotted #000",
                    display: "inline-block",
                    flex: 1,
                    width: "70%",
                    marginLeft: 4,
                  }}
                >
                  &nbsp;
                </span> */}
              </div>

              {/* Title */}
              <div
                style={{
                  textAlign: "center",
                  fontWeight: "bold",
                  fontFamily: "Times New Roman",
                  fontSize: scaleValue(16),
                  marginBottom: scaleValue(12),
                  textTransform: "uppercase",
                }}
              >
                {doc.title}
              </div>

              {/* Table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                  fontSize: scaleValue(10),
                  marginTop: scaleValue(2),
                }}
              >
                <colgroup>
                  <col style={{ width: "6.5%" }} />
                  <col style={{ width: "52%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "22.5%" }} />
                  <col style={{ width: "6%" }} />
                </colgroup>
                {/* Header Row 1 */}
                <thead>
                  <tr>
                    <th
                      style={{
                        border: tableBorder,
                        padding: `${scaleValue(7)}px ${scaleValue(4)}px ${scaleValue(5)}px`,
                        fontWeight: "bold",
                        fontFamily: tableHeaderFont,
                        fontSize: scaleValue(14),
                        lineHeight: 1,
                      }}
                    >
                      QTY
                    </th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: `${scaleValue(7)}px ${scaleValue(4)}px ${scaleValue(5)}px`,
                        fontWeight: "bold",
                        fontFamily: tableHeaderFont,
                        fontSize: scaleValue(14),
                        lineHeight: 1,
                      }}
                    >
                      DESCRIPTION
                    </th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: `${scaleValue(7)}px ${scaleValue(4)}px ${scaleValue(5)}px`,
                        fontWeight: "bold",
                        fontFamily: tableHeaderFont,
                        fontSize: scaleValue(14),
                        fontStyle: "italic",
                        lineHeight: 1,
                      }}
                    >
                      @
                    </th>
                    <th
                      colSpan={2}
                      style={{
                        border: tableBorder,
                        padding: `${scaleValue(7)}px ${scaleValue(4)}px ${scaleValue(5)}px`,
                        fontWeight: "bold",
                        textAlign: "center",
                        fontFamily: tableHeaderFont,
                        fontSize: scaleValue(14),
                        lineHeight: 1,
                      }}
                    >
                      AMOUNT
                    </th>
                  </tr>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        border: tableBorder,
                        padding: `${scaleValue(7)}px 0`,
                        backgroundColor: tableBlue,
                      }}
                    ></th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: `${scaleValue(5)}px ${scaleValue(2)}px`,
                        textAlign: "center",
                        fontFamily: tableHeaderFont,
                        fontSize: scaleValue(12),
                        fontStyle: "italic",
                        lineHeight: 1,
                      }}
                    >
                      K
                    </th>
                    <th
                      style={{
                        border: tableBorder,
                        padding: `${scaleValue(5)}px ${scaleValue(2)}px`,
                        textAlign: "center",
                        fontFamily: tableHeaderFont,
                        fontSize: scaleValue(12),
                        fontStyle: "italic",
                        lineHeight: 1,
                      }}
                    >
                      t
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: any, idx: number) => {
                    const { kwacha, tambala } = formatAmount(item.amount);
                    return (
                      <tr key={idx}>
                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "center",
                          }}
                        >
                          {item.qty}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.description}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "right",
                            paddingRight: scaleValue(10),
                          }}
                        >
                          {formatGroupedNumber(item.unit_price || 0)}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "right",
                            paddingRight: scaleValue(10),
                          }}
                        >
                          {kwacha}
                        </td>
                        <td
                          style={{
                            ...bodyCellStyle,
                            textAlign: "center",
                            paddingLeft: 0,
                            paddingRight: 0,
                          }}
                        >
                          {tambala}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty rows */}
                  {Array.from({ length: emptyRows }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td style={{ ...bodyCellStyle, height: scaleValue(20) }}>&nbsp;</td>
                      <td style={bodyCellStyle}>&nbsp;</td>
                      <td style={bodyCellStyle}>&nbsp;</td>
                      <td style={isInvoice ? { ...bodyCellStyle, backgroundColor: tableBlue } : bodyCellStyle}>&nbsp;</td>
                      <td style={isInvoice ? { ...bodyCellStyle, backgroundColor: tableBlue } : { ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0 }}>
                        {!isInvoice && "00"}
                      </td>
                    </tr>
                  ))}
                  {/* Footer Logic */}
                  {isInvoice ? (
                    <>
                      <tr style={{ height: scaleValue(38) }}>
                        <td style={{ ...bodyCellStyle, backgroundColor: tableBlue }} />
                        <td style={{ ...bodyCellStyle, backgroundColor: tableBlue }} />
                        <td style={{ ...bodyCellStyle, backgroundColor: tableBlue }} />
                        <td style={{ ...bodyCellStyle, textAlign: "right", paddingRight: scaleValue(10), fontWeight: "bold" }}>
                          {formatAmount(subtotal).kwacha}
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0, fontWeight: "bold" }}>
                          {formatAmount(subtotal).tambala}
                        </td>
                      </tr>
                      <tr style={{ height: scaleValue(34) }}>
                        <td style={{ ...bodyCellStyle, backgroundColor: tableBlue }} />
                        <td style={{ ...bodyCellStyle, textAlign: "right", paddingRight: scaleValue(10), fontWeight: "bold" }}>
                          Labour charge
                        </td>
                        <td style={{ ...bodyCellStyle, backgroundColor: tableBlue }} />
                        <td style={{ ...bodyCellStyle, textAlign: "right", paddingRight: scaleValue(10), fontWeight: "bold" }}>
                          {formatAmount(laborCost).kwacha}
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0, fontWeight: "bold" }}>
                          {formatAmount(laborCost).tambala}
                        </td>
                      </tr>
                      <tr style={{ height: scaleValue(34) }}>
                        <td colSpan={3} style={{ ...bodyCellStyle, textAlign: "center", fontWeight: "bold", fontFamily: calibriFont, fontSize: netTotalFontSize }}>
                          NET TOTAL
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "right", paddingRight: scaleValue(10), fontWeight: "bold", fontFamily: calibriFont, fontSize: netTotalFontSize }}>
                          {formatAmount(total).kwacha}
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0, fontWeight: "bold", fontFamily: calibriFont, fontSize: netTotalFontSize }}>
                          {formatAmount(total).tambala}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <>
                      {/* Total Cost of Materials */}
                      <tr style={{ height: scaleValue(38) }}>
                        <td style={bodyCellStyle}>&nbsp;</td>
                        <td style={{ ...bodyCellStyle, textAlign: "center", fontWeight: "bold", fontFamily: centuryGothicFont, fontSize: totalMaterialsFontSize, letterSpacing: `${scaleValue(0.01)}em` }}>
                          TOTAL COST OF MATERIALS
                        </td>
                        <td style={bodyCellStyle}>&nbsp;</td>
                        <td style={{ ...bodyCellStyle, textAlign: "right", paddingRight: scaleValue(10), fontWeight: "bold", fontFamily: centuryGothicFont, fontSize: totalMaterialsFontSize }}>
                          {formatAmount(subtotal).kwacha}
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0, fontWeight: "bold", fontFamily: centuryGothicFont, fontSize: totalMaterialsFontSize }}>
                          {formatAmount(subtotal).tambala}
                        </td>
                      </tr>
                      <tr style={{ height: scaleValue(34) }}>
                        <td colSpan={3} style={{ ...bodyCellStyle, textAlign: "center", fontWeight: "bold", fontFamily: centuryGothicFont, fontSize: laborFontSize }}>
                          Labour cost and transport
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "right", paddingRight: scaleValue(10), fontWeight: "bold", fontFamily: centuryGothicFont, fontSize: laborFontSize }}>
                          {formatAmount(laborCost).kwacha}
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0, fontWeight: "bold", fontFamily: centuryGothicFont, fontSize: laborFontSize }}>
                          {formatAmount(laborCost).tambala}
                        </td>
                      </tr>
                      <tr style={{ height: scaleValue(34) }}>
                        <td colSpan={3} style={{ ...bodyCellStyle, textAlign: "center", fontWeight: "bold", fontFamily: calibriFont, fontSize: netTotalFontSize }}>
                          NET TOTAL
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "right", paddingRight: scaleValue(10), fontWeight: "bold", fontFamily: calibriFont, fontSize: netTotalFontSize }}>
                          {formatAmount(total).kwacha}
                        </td>
                        <td style={{ ...bodyCellStyle, textAlign: "center", paddingLeft: 0, paddingRight: 0, fontWeight: "bold", fontFamily: calibriFont, fontSize: netTotalFontSize }}>
                          {formatAmount(total).tambala}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              {/* Notes */}
              {doc.content?.notes && (
                <div style={{ marginTop: scaleValue(12), fontSize: scaleValue(9), whiteSpace: "pre-wrap" }}>
                 * {doc.content.notes}
                </div>
              )}
              
              {/* Signature section */}
              {isInvoice && (
                <div style={{ marginTop: scaleValue(40), marginBottom: scaleValue(20), textAlign: "right", fontSize: scaleValue(11), fontFamily: '"Times New Roman", Times, serif', fontStyle: "italic", marginRight: scaleValue(4) }}>
                  Authorised signature: .......................................
                </div>
              )}

              </div>

              {/* Orange footer bar */}
              <div
                style={{
                  height: scaleValue(16),
                  backgroundColor: "#f59e0b",
                  marginTop: "auto",
                  marginLeft: `-${scaleValue(24)}px`,
                  marginRight: `-${scaleValue(24)}px`,
                  marginBottom: `-${scaleValue(16)}px`,
                }}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
