module.exports = function (app) {
    
    // Core Page
    app.get('/', function (req, res) {
        res.render('index');
    });
    
    // Static HTML Pages
    app.get('/static/html/:page.html', function (req, res) {
        var staticPageName = req.params.page;
        if (staticPageName == 'index') {
            res.status(404); // File doesn't exist
            res.send('Cannot GET /static/html/index.html');
        } else {
            res.render(staticPageName, {}, function (err, html) {
                if (err) {
                    res.status(404); // File doesn't exist
                    res.send('Cannot GET /static/html/' + staticPageName + '.html');
                } else {
                    res.send(html);
                }
            });
        }
    });
    
    // Catch-All
    app.get('/:otherPage', function (req, res) {
        res.redirect('/');
    });
}
