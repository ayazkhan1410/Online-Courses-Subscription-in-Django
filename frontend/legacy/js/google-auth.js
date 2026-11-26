(function (global) {
  function themeForGis() {
    return document.documentElement.getAttribute('data-theme') === 'dark'
      ? 'filled_black'
      : 'outline';
  }

  async function handleCredential(response) {
    const alertBox = document.getElementById('alert-box');
    try {
      const data = await API.googleLogin({ credential: response.credential });
      if (data && data.mfa_required && global.LoginMfa && LoginMfa.show) {
        LoginMfa.show(data);
        return;
      }
      API.setSession(data.token, data.user);
      const next =
        (window.Nav && Nav.qs('next')) || '/dashboard.html';
      window.location.href = next;
    } catch (err) {
      if (alertBox) {
        alertBox.innerHTML =
          '<div class="alert alert-warning">' + API.formatError(err) + '</div>';
      }
    }
  }

  async function mount(buttonId) {
    const host = document.getElementById(buttonId);
    if (!host || !window.google || !google.accounts) {
      return;
    }
    let clientId = '';
    try {
      const config = await API.getConfig();
      clientId = config.google_client_id || '';
    } catch (err) {
      return;
    }
    if (!clientId) {
      host.hidden = true;
      const divider = document.getElementById('google-divider');
      if (divider) divider.hidden = true;
      return;
    }
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      ux_mode: 'popup',
    });
    google.accounts.id.renderButton(host, {
      theme: themeForGis(),
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: host.offsetWidth || 320,
    });
  }

  global.GoogleAuth = { mount: mount };
})(window);
