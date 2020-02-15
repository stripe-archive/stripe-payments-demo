import React from 'react';
import paymentMethods from '../utils/payment-methods';

const selectCountry = ({config, country}) => {
  // TODO refactor with React
  const form = document.getElementById('payment-form');
  if (!country) {
    country = form.querySelector('select[name=country] option:checked').value;
  }
  const selector = document.getElementById('country');
  selector.querySelector(`option[value=${country}]`).selected = 'selected';
  selector.className = `field ${country}`;

  // Trigger the methods to show relevant fields and payment methods on page load.
  // showRelevantFormFields();
  const zipLabel = form.querySelector('label.zip');
  // Only show the state input for the United States.
  zipLabel.parentElement.classList.toggle('with-state', country === 'US');
  // Update the ZIP label to make it more relevant for each country.
  form.querySelector('label.zip span').innerText =
    country === 'US' ? 'ZIP' : country === 'GB' ? 'Postcode' : 'Postal Code';
  // showRelevantPaymentMethods();
  const paymentInputs = form.querySelectorAll('input[name=payment]');
  for (let i = 0; i < paymentInputs.length; i++) {
    let input = paymentInputs[i];
    input.parentElement.classList.toggle(
      'visible',
      input.value === 'card' ||
        (config.paymentMethods.includes(input.value) &&
          paymentMethods[input.value].countries.includes(country) &&
          paymentMethods[input.value].currencies.includes(config.currency))
    );
  }

  // Hide the tabs if card is the only available option.
  const paymentMethodsTabs = document.getElementById('payment-methods');
  paymentMethodsTabs.classList.toggle(
    'visible',
    paymentMethodsTabs.querySelectorAll('li.visible').length > 1
  );

  // Check the first payment option again.
  paymentInputs[0].checked = 'checked';
  form.querySelector('.payment-info.card').classList.add('visible');
  form.querySelector('.payment-info.ideal').classList.remove('visible');
  form.querySelector('.payment-info.sepa_debit').classList.remove('visible');
  form.querySelector('.payment-info.wechat').classList.remove('visible');
  form.querySelector('.payment-info.redirect').classList.remove('visible');
  // updateButtonLabel(paymentInputs[0].value);
};

const BillingInformation = ({config}) => {
  const handleCountrySelect = event => {
    event.preventDefault();
    selectCountry({country: event.target.value, config});
  };

  return (
    <section>
      <h2>Shipping & Billing Information</h2>
      <fieldset className="with-state">
        <label>
          <span>Name</span>
          <input
            name="name"
            className="field"
            placeholder="Jenny Rosen"
            required
          />
        </label>
        <label>
          <span>Email</span>
          <input
            name="email"
            type="email"
            className="field"
            placeholder="jenny@example.com"
            required
          />
        </label>
        <label>
          <span>Address</span>
          <input
            name="address"
            className="field"
            placeholder="185 Berry Street Suite 550"
          />
        </label>
        <label>
          <span>City</span>
          <input name="city" className="field" placeholder="San Francisco" />
        </label>
        <label className="state">
          <span>State</span>
          <input name="state" className="field" placeholder="CA" />
        </label>
        <label className="zip">
          <span>ZIP</span>
          <input name="postal_code" className="field" placeholder="94107" />
        </label>
        <label className="select">
          <span>Country</span>
          <div id="country" className="field US">
            <select
              name="country"
              defaultValue="US"
              onChange={handleCountrySelect}
            >
              <option value="AU">Australia</option>
              <option value="AT">Austria</option>
              <option value="BE">Belgium</option>
              <option value="BR">Brazil</option>
              <option value="CA">Canada</option>
              <option value="CN">China</option>
              <option value="DK">Denmark</option>
              <option value="FI">Finland</option>
              <option value="FR">France</option>
              <option value="DE">Germany</option>
              <option value="HK">Hong Kong</option>
              <option value="IE">Ireland</option>
              <option value="IT">Italy</option>
              <option value="JP">Japan</option>
              <option value="LU">Luxembourg</option>
              <option value="MY">Malaysia</option>
              <option value="MX">Mexico</option>
              <option value="NL">Netherlands</option>
              <option value="NZ">New Zealand</option>
              <option value="NO">Norway</option>
              <option value="PT">Portugal</option>
              <option value="SG">Singapore</option>
              <option value="ES">Spain</option>
              <option value="SE">Sweden</option>
              <option value="CH">Switzerland</option>
              <option value="GB">United Kingdom</option>
              <option value="US">United States</option>
            </select>
          </div>
        </label>
      </fieldset>
      <p className="tip">
        Select another country to see different payment options.
      </p>
    </section>
  );
};

export default BillingInformation;
