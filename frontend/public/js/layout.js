(function () {
  function injectShell(title) {
    const shell = document.getElementById('app-shell');
    if (!shell) {
      return;
    }
    document.title = title || 'Study with Ayaz';
    shell.insertAdjacentHTML(
      'afterbegin',
      '<nav class="navbar navbar-expand-lg navbar-dark bg-dark">' +
        '<div class="container-fluid mt-3">' +
          '<a class="navbar-brand" href="/index.html"><b>Study with ayaz</b></a>' +
          '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" ' +
            'data-bs-target="#navbarNav" aria-controls="navbarNav" ' +
            'aria-expanded="false" aria-label="Toggle navigation">' +
            '<span class="navbar-toggler-icon"></span>' +
          '</button>' +
          '<div class="collapse navbar-collapse" id="navbarNav">' +
            '<ul class="navbar-nav">' +
              '<li class="nav-item">' +
                '<a class="nav-link" href="/index.html">Home</a>' +
              '</li>' +
              '<li class="nav-item">' +
                '<a class="nav-link" href="/contact.html">Contact me</a>' +
              '</li>' +
              '<li class="nav-item">' +
                '<a class="nav-link" href="/about.html">About me</a>' +
              '</li>' +
            '</ul>' +
          '</div>' +
          '<li class="nav-item d-flex align-items-center flex-wrap">' +
            '<span id="nav-auth"></span>' +
            '<span id="nav-pro"></span>' +
          '</li>' +
          '<form class="d-flex ms-2" id="nav-search" role="search">' +
            '<input class="form-control me-2" name="search" ' +
              'placeholder="Search here" aria-label="Search">' +
            '<button class="btn btn-outline-success" type="submit">Search</button>' +
          '</form>' +
        '</div>' +
      '</nav>'
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    injectShell(document.body.dataset.pageTitle);
  });
})();
