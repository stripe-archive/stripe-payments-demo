/**
 * @type {Faker.FakerStatic}
 */
const faker = window.faker;
const generateInputTrigger = document.getElementById('generate');
// faker.locale = 'id_ID';
faker.locale = 'en';
const {name, address, internet, phone} = faker;

const safeGetElement = (elementName) => 
  document.getElementsByName(elementName)[0] || {};


generateInputTrigger.addEventListener('click', () => {
  safeGetElement('name').value = `${name.firstName()} ${name.lastName()}`;
  safeGetElement('email').value = internet.email();
  safeGetElement('address').value = `${address.streetAddress()}`;
  safeGetElement('city').value = `${address.city()}`;
  safeGetElement('state').value = `${address.state()}`;
  safeGetElement('postal_code').value = `${address.zipCode()}`;
  safeGetElement('phone').value = `${phone.phoneNumber()}`;
});
