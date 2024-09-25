import { isNil } from 'lodash';

const validPhoneNumber = (phoneNumber: string) => {
  if (isNil(phoneNumber)) {
    return phoneNumber;
  }
  if (phoneNumber.startsWith('0')) {
    return phoneNumber;
  }
  const convertedPhoneNumber = '0' + phoneNumber.slice(2);
  return convertedPhoneNumber;
};

export { validPhoneNumber };
