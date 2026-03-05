function requireAuth(req, res, next) {
    if (req.session && req.session.adminId) {
        return next();
    }
    return res.redirect('/auth/login');
}

module.exports = { requireAuth };
