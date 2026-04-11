"""
Invoice generation service using ReportLab for PDF creation
"""
import io
from datetime import datetime
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
)
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from sqlmodel import Session

from app.models import Invoice, Order, OrderItem, Product, User


class InvoiceService:
    """Service for generating and managing invoices"""
    
    @staticmethod
    def generate_invoice_pdf(
        invoice: Invoice,
        order: Order,
        user: User,
        order_items: list[OrderItem],
        company_name: str = "Sikapa Store"
    ) -> bytes:
        """
        Generate a professional PDF invoice
        
        Args:
            invoice: Invoice model instance
            order: Associated order
            user: Customer information
            order_items: List of items in the order
            company_name: Company name for header
            
        Returns:
            bytes: PDF content as bytes
        """
        # Create a BytesIO buffer to store PDF
        buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )
        
        # Container for PDF elements
        elements = []
        
        # Define styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=12,
            alignment=1  # Center
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#374151'),
            spaceAfter=6
        )
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#4b5563')
        )
        
        # Header - Company name and Invoice title
        elements.append(Paragraph(f"<b>{company_name}</b>", title_style))
        elements.append(Paragraph("INVOICE", heading_style))
        elements.append(Spacer(1, 0.2*inch))
        
        # Invoice details
        invoice_details_data = [
            ["Invoice Number:", invoice.invoice_number, "Invoice Date:", invoice.issued_at.strftime("%Y-%m-%d")],
            ["Order Number:", f"ORD-{order.id}", "Due Date:", 
             invoice.due_at.strftime("%Y-%m-%d") if invoice.due_at else "Upon Receipt"],
            ["Payment Status:", invoice.status.capitalize(), "Payment Method:", order.payment_method or "Not specified"]
        ]
        
        details_table = Table(invoice_details_data, colWidths=[1.2*inch, 1.5*inch, 1.2*inch, 1.5*inch])
        details_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#4b5563')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 3),
            ('RIGHTPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Customer info
        elements.append(Paragraph("<b>Bill To:</b>", heading_style))
        customer_info = f"""
        {user.first_name or ''} {user.last_name or ''}<br/>
        {user.email}<br/>
        {user.phone or 'N/A'}
        """
        elements.append(Paragraph(customer_info, normal_style))
        
        if order.shipping_address:
            elements.append(Paragraph("<b>Ship To:</b>", heading_style))
            elements.append(Paragraph(order.shipping_address, normal_style))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Order items table
        items_data = [["Item", "SKU", "Qty", "Unit Price", "Total"]]
        
        for item in order_items:
            product = None
            # Try to get product details if available
            try:
                # Note: Product info should be passed in or fetched separately
                item_name = f"Product ID: {item.product_id}"
                sku = "N/A"
            except:
                item_name = f"Product ID: {item.product_id}"
                sku = "N/A"
            
            total = float(item.quantity * item.price_at_purchase)
            items_data.append([
                item_name,
                sku,
                str(item.quantity),
                f"${item.price_at_purchase:.2f}",
                f"${total:.2f}"
            ])
        
        items_table = Table(items_data, colWidths=[2.5*inch, 0.8*inch, 0.6*inch, 1*inch, 1*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5e7eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
            ('ALIGN', (0, 1), (1, -1), 'LEFT'),
        ]))
        elements.append(items_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Totals
        totals_data = [
            ["Subtotal:", f"${invoice.subtotal:.2f}"],
            ["Tax:", f"${invoice.tax:.2f}"],
            ["Shipping:", f"${invoice.shipping:.2f}"],
            ["TOTAL:", f"${invoice.total:.2f}"]
        ]
        
        totals_table = Table(totals_data, colWidths=[4*inch, 1.5*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -2), 'Helvetica'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -2), 10),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e5e7eb')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(totals_table)
        
        # Tracking information if available
        if order.tracking_number or order.shipping_provider:
            elements.append(Spacer(1, 0.3*inch))
            elements.append(Paragraph("<b>Shipping Information:</b>", heading_style))
            tracking_info = ""
            if order.shipping_provider:
                tracking_info += f"Provider: {order.shipping_provider}<br/>"
            if order.tracking_number:
                tracking_info += f"Tracking Number: {order.tracking_number}<br/>"
            if order.estimated_delivery:
                tracking_info += f"Estimated Delivery: {order.estimated_delivery.strftime('%Y-%m-%d')}"
            elements.append(Paragraph(tracking_info, normal_style))
        
        # Footer
        elements.append(Spacer(1, 0.3*inch))
        elements.append(Paragraph(
            f"<i>Invoice generated on {invoice.issued_at.strftime('%Y-%m-%d %H:%M:%S')}</i>",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
        ))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF bytes
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def generate_invoice_number(order_id: int, invoice_id: int) -> str:
        """
        Generate a unique invoice number
        
        Args:
            order_id: Associated order ID
            invoice_id: Invoice ID
            
        Returns:
            str: Formatted invoice number
        """
        timestamp = datetime.utcnow().strftime("%Y%m")
        return f"INV-{timestamp}-{invoice_id:05d}"
