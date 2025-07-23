import type { Express } from "express";
import { storage } from "../storage";

export function registerReportRoutes(app: Express) {
  // Get all saved reports
  app.get('/api/reports', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const reports = await storage.getReportsByUser(req.user.id);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  });

  // Save a new report
  app.post('/api/reports', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, description, periodConfigs } = req.body;
      
      const report = await storage.createReport({
        userId: req.user.id,
        name,
        description,
        periodConfigs,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json(report);
    } catch (error) {
      console.error('Error saving report:', error);
      res.status(500).json({ error: 'Failed to save report' });
    }
  });

  // Delete a report
  app.delete('/api/reports/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await storage.deleteReport(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting report:', error);
      res.status(500).json({ error: 'Failed to delete report' });
    }
  });

  // Generate PDF for a report
  app.post('/api/reports/:id/pdf', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const report = await storage.getReport(req.params.id, req.user.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      // Mock PDF generation - in production you'd use puppeteer or similar
      const pdfBuffer = Buffer.from(`PDF Report: ${report.name}\nGenerated: ${new Date().toISOString()}\nPeriods: ${report.periodConfigs.length}`);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  // Export current dashboard to PDF
  app.post('/api/export/pdf', async (req, res) => {
    try {
      const { reportData, options } = req.body;
      
      // Mock PDF generation with options
      const content = `
PDF Report: ${options.title}
Description: ${options.description || 'N/A'}
Format: ${options.pageFormat} ${options.orientation}
Generated: ${new Date().toISOString()}

Periods: ${reportData.periods?.length || 0}
Locations: ${reportData.locations?.length || 0}

Include Charts: ${options.includeCharts}
Include Data: ${options.includeData}
Include Summary: ${options.includeSummary}
      `;
      
      const pdfBuffer = Buffer.from(content);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${options.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  });
}