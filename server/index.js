export default async function handler(req, res) {
  try {
    const mod = await import('./dist/index.js');
    const app = mod.default || mod.app;
    if (typeof app === 'function') {
      return app(req, res);
    }
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'App export is not a function', modKeys: Object.keys(mod) }));
  } catch (err) {
    console.error('Server Handler Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Backend Execution Error',
      name: err.name,
      message: err.message,
      stack: err.stack
    }));
  }
}
