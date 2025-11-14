import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Health check
app.get('/make-server-1a997823/health', (c) => {
  return c.json({ status: 'ok', service: 'GaavConnect API' });
});

// Save route
app.post('/make-server-1a997823/routes', async (c) => {
  try {
    const body = await c.req.json();
    const { origin, stops, segments, totalCost, totalDuration, totalDistance, algorithm } = body;

    if (!origin || !stops || !segments) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const routeId = `route-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const route = {
      id: routeId,
      origin,
      stops,
      segments,
      totalCost,
      totalDuration,
      totalDistance,
      algorithm,
      createdAt: new Date().toISOString(),
    };

    await kv.set(routeId, route);

    // Also increment route count
    const countKey = 'stats:route-count';
    const currentCount = await kv.get(countKey);
    const newCount = (currentCount ? parseInt(currentCount as string) : 0) + 1;
    await kv.set(countKey, newCount.toString());

    return c.json({ success: true, routeId, route });
  } catch (error) {
    console.log('Error saving route:', error);
    return c.json({ error: 'Failed to save route', details: String(error) }, 500);
  }
});

// Get route by ID
app.get('/make-server-1a997823/routes/:id', async (c) => {
  try {
    const routeId = c.req.param('id');
    const route = await kv.get(routeId);

    if (!route) {
      return c.json({ error: 'Route not found' }, 404);
    }

    return c.json({ success: true, route });
  } catch (error) {
    console.log('Error fetching route:', error);
    return c.json({ error: 'Failed to fetch route', details: String(error) }, 500);
  }
});

// Get recent routes
app.get('/make-server-1a997823/routes', async (c) => {
  try {
    const routes = await kv.getByPrefix('route-');
    
    // Sort by createdAt (most recent first) and limit to 20
    const sortedRoutes = routes
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 20);

    return c.json({ success: true, routes: sortedRoutes });
  } catch (error) {
    console.log('Error fetching routes:', error);
    return c.json({ error: 'Failed to fetch routes', details: String(error) }, 500);
  }
});

// Save crowd report
app.post('/make-server-1a997823/crowd-reports', async (c) => {
  try {
    const body = await c.req.json();
    const { routeName, transportMode, fare, timing, comments } = body;

    if (!routeName || !transportMode || !fare || !timing) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const report = {
      id: reportId,
      routeName,
      transportMode,
      fare: parseFloat(fare),
      timing,
      comments: comments || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await kv.set(reportId, report);

    // Increment report count
    const countKey = 'stats:report-count';
    const currentCount = await kv.get(countKey);
    const newCount = (currentCount ? parseInt(currentCount as string) : 0) + 1;
    await kv.set(countKey, newCount.toString());

    return c.json({ success: true, reportId, report });
  } catch (error) {
    console.log('Error saving crowd report:', error);
    return c.json({ error: 'Failed to save report', details: String(error) }, 500);
  }
});

// Get crowd reports
app.get('/make-server-1a997823/crowd-reports', async (c) => {
  try {
    const reports = await kv.getByPrefix('report-');
    
    // Sort by createdAt (most recent first)
    const sortedReports = reports
      .sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 50);

    return c.json({ success: true, reports: sortedReports });
  } catch (error) {
    console.log('Error fetching crowd reports:', error);
    return c.json({ error: 'Failed to fetch reports', details: String(error) }, 500);
  }
});

// Update report status (verify)
app.patch('/make-server-1a997823/crowd-reports/:id', async (c) => {
  try {
    const reportId = c.req.param('id');
    const body = await c.req.json();
    const { status } = body;

    const report = await kv.get(reportId);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    const updatedReport = {
      ...(report as any),
      status,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(reportId, updatedReport);

    return c.json({ success: true, report: updatedReport });
  } catch (error) {
    console.log('Error updating report:', error);
    return c.json({ error: 'Failed to update report', details: String(error) }, 500);
  }
});

// Get statistics
app.get('/make-server-1a997823/stats', async (c) => {
  try {
    const routeCountValue = await kv.get('stats:route-count');
    const reportCountValue = await kv.get('stats:report-count');
    
    const routeCount = routeCountValue ? parseInt(routeCountValue as string) : 0;
    const reportCount = reportCountValue ? parseInt(reportCountValue as string) : 0;

    // Get all routes and reports for additional stats
    const routes = await kv.getByPrefix('route-');
    const reports = await kv.getByPrefix('report-');

    // Calculate verified reports
    const verifiedReports = reports.filter((r: any) => r.status === 'verified').length;

    // Calculate mode distribution from routes
    const modeCount: Record<string, number> = {};
    routes.forEach((route: any) => {
      route.segments?.forEach((seg: any) => {
        modeCount[seg.mode] = (modeCount[seg.mode] || 0) + 1;
      });
    });

    return c.json({
      success: true,
      stats: {
        totalRoutes: routeCount,
        totalReports: reportCount,
        verifiedReports,
        activeUsers: Math.floor(routeCount * 2.8), // Simulated
        villagesCovered: Math.floor(routeCount * 0.1), // Simulated
        modeDistribution: modeCount,
      },
    });
  } catch (error) {
    console.log('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats', details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
