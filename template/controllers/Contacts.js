/* eslint-disable */
import Contacts from 'react-native-contacts'

class AirNativeContacts {
    constructor() {}

    getContacts = () => {
        return new Promise((resolve, reject) => {
          Contacts.checkPermission().then((permission) => {
            if (permission === 'undefined') {
              Contacts.requestPermission().then(() => {
                resolve(this.getContacts());
              });
            }
            if (permission === 'authorized') {
              Contacts.getAll().then((contacts) => {
                let listOfContacts = contacts.map((contact, index, array) => {
                  return {
                    _p_familyName: contact.familyName,
                    _p_givenName: contact.givenName,
                    _p_middleName: contact.middleName,
                    _p_firstNumber:
                      contact.phoneNumbers[0] !== undefined
                        ? contact.phoneNumbers[0].number
                        : '',
                    _p_secondNumber:
                      contact.phoneNumbers[1] !== undefined
                        ? contact.phoneNumbers[1].number
                        : '',
                    _p_thirdNumber:
                      contact.phoneNumbers[2] !== undefined
                        ? contact.phoneNumbers[2].number
                        : '',
                    _p_birthday:
                      contact.birthday !== null && contact.birthday !== undefined
                        ? new Date(
                            contact.birthday.year,
                            contact.birthday.month,
                            contact.birthday.day
                          )
                        : null,
                    _p_emailAddress:
                      contact.emailAddresses[0] !== undefined
                        ? contact.emailAddresses[0].email
                        : '',
                  };
                });
                resolve(listOfContacts);
              });
            }
            if (permission === 'denied') {
              resolve('Permission to contacts denied!');
            }
          });
        });
      };
}

module.exports = AirNativeContacts;