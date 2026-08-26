// Popup script
$(() => {
  const $toggle = $('#toggle-button'), $status = $('#status-text');
  const $upgrade = $('#upgrade-container'), $badge = $('#premium-badge-container');

  // Init
  browser.runtime.sendMessage({ action: 'getStatus' }).then(r => updateUI(r));
  browser.storage.local.get(['premium']).then(r => updatePremium(r.premium));

  // Events
  $toggle.click(() => {
    // Check if disabled prop is set (visual) or check premium storage (secure)
    if ($toggle.prop('disabled')) return;
    browser.runtime.sendMessage({ action: 'toggle' }).then(r => updateUI(r));
  });
  $('#upgrade-button').click(() => browser.storage.local.get(['subscriptionUrl']).then(r =>
    browser.tabs.create({ url: r.subscriptionUrl || 'https://www.buymeacoffee.com/trinhnv1205/membership' })));

  $('#restore-link').click(e => { e.preventDefault(); $('#restore-form').toggleClass('d-none'); });
  $('#verify-btn').click(function () {
    const email = $('#email-input').val();
    if (!email) return;
    const $btn = $(this).prop('disabled', true).text('...');
    $('#verify-msg').text('').removeClass('text-success text-danger');

    browser.runtime.sendMessage({ action: 'verifyEmail', email }).then(r => {
      $btn.prop('disabled', false).text(browser.i18n.getMessage('btnVerify'));
      if (r && r.success && r.premium) {
        $('#verify-msg').text(browser.i18n.getMessage('verifySuccess')).addClass('text-success');
        setTimeout(() => updatePremium(true), 1000);
      } else {
        $('#verify-msg').text(browser.i18n.getMessage('verifyNotFound')).addClass('text-danger');
      }
    });
  });

  function updateUI(response) {
    if (!response) return;
    const on = response.isEnabled !== false;
    $toggle.text(on ? browser.i18n.getMessage('btnOn') : browser.i18n.getMessage('btnOff')).toggleClass('active', on);

    if (response.hasCookie) {
      $status.text('Logged In');
      $('#status-sub').text('Native access granted');
    } else if (response.isLimitReached && !response.isPremium) {
      $status.text('Limit Reached');
      $('#status-sub').text('Protection paused');
      $('#limit-warning').removeClass('d-none');
    } else {
      $status.text(on ? browser.i18n.getMessage('statusActive') : browser.i18n.getMessage('statusDisabled'));
      $('#status-sub').text(browser.i18n.getMessage('statusSub'));
      $('#limit-warning').addClass('d-none');
    }
  }

  function updatePremium(isPremium) {
    $upgrade.toggle(!isPremium);
    $badge.toggleClass('d-none', !isPremium);

    // Lock toggle for free users
    $toggle.prop('disabled', !isPremium);
    if (!isPremium) {
      $toggle.attr('title', browser.i18n.getMessage('premiumFeatureOnly'));
    } else {
      $toggle.removeAttr('title');
      $('.premium-headline').text(browser.i18n.getMessage('premiumThankYou'));
      $('.premium-subhead').text(browser.i18n.getMessage('premiumUnlimited'));
    }
  }
});
