(function (global) {
  const TOKEN_KEY = 'auth_token';
  const USER_KEY = 'auth_user';

  function apiBase() {
    return (global.APP_CONFIG && global.APP_CONFIG.API_BASE_URL) ||
      'http://localhost:4781/api';
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function setSession(token, user) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function request(path, options) {
    const opts = options || {};
    const headers = Object.assign(
      { Accept: 'application/json' },
      opts.headers || {}
    );
    const token = getToken();
    if (token) {
      headers.Authorization = 'Token ' + token;
    }
    if (opts.body && !(opts.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(apiBase().replace(/\/$/, '') + path, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body
        ? (opts.body instanceof FormData
          ? opts.body
          : JSON.stringify(opts.body))
        : undefined,
    });

    let data = null;
    const text = await response.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = { detail: text };
      }
    }

    if (!response.ok) {
      const error = new Error(
        (data && (data.detail || data.message)) ||
          'Request failed (' + response.status + ')'
      );
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function formatError(err) {
    if (!err) {
      return 'Something went wrong';
    }
    if (err.data && typeof err.data === 'object') {
      const parts = [];
      Object.keys(err.data).forEach(function (key) {
        const value = err.data[key];
        if (Array.isArray(value)) {
          parts.push(value.join(' '));
        } else if (typeof value === 'string' && key !== 'detail') {
          parts.push(value);
        }
      });
      if (parts.length) {
        return parts.join(' ');
      }
      if (err.data.detail) {
        return String(err.data.detail);
      }
    }
    return err.message || 'Something went wrong';
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (global.turnstile) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-turnstile]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(); });
        existing.addEventListener('error', function () {
          reject(new Error('Turnstile failed to load'));
        });
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.setAttribute('data-turnstile', '1');
      script.onload = function () { resolve(); };
      script.onerror = function () {
        reject(new Error('Turnstile failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  async function mountTurnstile(container) {
    const el = typeof container === 'string'
      ? document.getElementById(container)
      : container;
    const idle = {
      enabled: false,
      get: function () { return ''; },
      reset: function () {},
    };
    if (!el) {
      return idle;
    }
    let siteKey = '';
    try {
      const config = await request('/config/');
      siteKey = (config && config.turnstile_site_key) || '';
    } catch (err) {
      siteKey = '';
    }
    if (!siteKey) {
      el.hidden = true;
      return idle;
    }
    el.hidden = false;
    await loadScript(
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    );
    const widgetId = global.turnstile.render(el, { sitekey: siteKey });
    return {
      enabled: true,
      get: function () {
        return global.turnstile.getResponse(widgetId) || '';
      },
      reset: function () {
        global.turnstile.reset(widgetId);
      },
    };
  }

  global.API = {
    getToken: getToken,
    getUser: getUser,
    setSession: setSession,
    clearSession: clearSession,
    formatError: formatError,
    getCourses: function (params) {
      const query = new URLSearchParams(params || {}).toString();
      return request('/courses/' + (query ? '?' + query : ''));
    },
    getCourse: function (slug) {
      return request('/courses/' + encodeURIComponent(slug) + '/');
    },
    contact: function (payload) {
      return request('/contact/', { method: 'POST', body: payload });
    },
    register: function (payload) {
      return request('/auth/register/', { method: 'POST', body: payload });
    },
    login: function (payload) {
      return request('/auth/login/', { method: 'POST', body: payload });
    },
    mfaVerify: function (payload) {
      return request('/auth/mfa/verify/', { method: 'POST', body: payload });
    },
    mfaResend: function (payload) {
      return request('/auth/mfa/resend/', { method: 'POST', body: payload });
    },
    mfaSetup: function () {
      return request('/auth/mfa/setup/', { method: 'POST', body: {} });
    },
    mfaConfirm: function (payload) {
      return request('/auth/mfa/confirm/', { method: 'POST', body: payload });
    },
    mfaDisable: function (payload) {
      return request('/auth/mfa/disable/', { method: 'POST', body: payload });
    },
    mfaStatus: function () {
      return request('/auth/mfa/status/');
    },
    mountTurnstile: function (container) {
      return mountTurnstile(container);
    },
    googleLogin: function (payload) {
      return request('/auth/google/', { method: 'POST', body: payload });
    },
    logout: function () {
      return request('/auth/logout/', { method: 'POST' });
    },
    me: function () {
      return request('/auth/me/');
    },
    forgetPassword: function (payload) {
      return request('/auth/forget-password/', {
        method: 'POST',
        body: payload,
      });
    },
    changePassword: function (payload) {
      return request('/auth/change-password/', {
        method: 'POST',
        body: payload,
      });
    },
    getSubscriptions: function () {
      return request('/subscriptions/');
    },
    becomePro: function (payload) {
      return request('/become-pro/', { method: 'POST', body: payload });
    },
    getConfig: function () {
      return request('/config/');
    },
    getDashboard: function () {
      return request('/dashboard/');
    },
    enrollCourse: function (slug) {
      return request('/courses/' + encodeURIComponent(slug) + '/enroll/', {
        method: 'POST',
        body: {},
      });
    },
    markLessonProgress: function (moduleId, completed) {
      return request('/modules/' + moduleId + '/progress/', {
        method: 'POST',
        body: { completed: completed !== false },
      });
    },
    getWishlist: function () {
      return request('/wishlist/');
    },
    addWishlist: function (slug) {
      return request('/wishlist/', {
        method: 'POST',
        body: { slug: slug },
      });
    },
    removeWishlist: function (slug) {
      return request('/wishlist/' + encodeURIComponent(slug) + '/', {
        method: 'DELETE',
      });
    },
  };
})(window);
