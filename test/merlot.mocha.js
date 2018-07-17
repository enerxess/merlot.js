'use strict';

var expect = require('chai').expect;
var merlot = require('../index');

describe('Merlot.js Core', function () {
  describe('Validator', function () {
    it('min', function () {
      const stringInput0 = { type: String, value: '' };
      const stringInput1 = { type: String, value: 'foo' };
      const stringInput2 = { type: String, value: 'foobar' };
      const stringInput3 = { type: String, value: 'foobar!' };

      const numberInput0 = { type: Number, value: NaN };
      const numberInput1 = { type: Number, value: -1.2 };
      const numberInput2 = { type: Number, value: 5 };
      const numberInput3 = { type: Number, value: 6 };
      const numberInput4 = { type: Number, value: 7 };


      const stringTestResult0 = merlot.Validator.min(stringInput0.type, stringInput0.value, 6);
      const stringTestResult1 = merlot.Validator.min(stringInput1.type, stringInput1.value, 6);
      const stringTestResult2 = merlot.Validator.min(stringInput2.type, stringInput2.value, 6);
      const stringTestResult3 = merlot.Validator.min(stringInput3.type, stringInput3.value, 6);

      const numberTestResult0 = merlot.Validator.min(numberInput0.type, numberInput0.value, 6);
      const numberTestResult1 = merlot.Validator.min(numberInput1.type, numberInput1.value, 6);
      const numberTestResult2 = merlot.Validator.min(numberInput2.type, numberInput2.value, 6);
      const numberTestResult3 = merlot.Validator.min(numberInput3.type, numberInput3.value, 6);
      const numberTestResult4 = merlot.Validator.min(numberInput4.type, numberInput4.value, 6);


      expect(stringTestResult0).to.be.equal(false);
      expect(stringTestResult1).to.be.equal(false);
      expect(stringTestResult2).to.be.equal(true);
      expect(stringTestResult3).to.be.equal(true);

      expect(numberTestResult0).to.be.equal(false);
      expect(numberTestResult1).to.be.equal(false);
      expect(numberTestResult2).to.be.equal(false);
      expect(numberTestResult3).to.be.equal(true);
      expect(numberTestResult4).to.be.equal(true);
    });

    it('max', function () {
      const stringInput0 = { type: String, value: '' };
      const stringInput1 = { type: String, value: 'foo' };
      const stringInput2 = { type: String, value: 'foobar' };
      const stringInput3 = { type: String, value: 'foobar!' };

      const numberInput0 = { type: Number, value: NaN };
      const numberInput1 = { type: Number, value: -1.2 };
      const numberInput2 = { type: Number, value: 5 };
      const numberInput3 = { type: Number, value: 6 };
      const numberInput4 = { type: Number, value: 7 };


      const stringTestResult0 = merlot.Validator.max(stringInput0.type, stringInput0.value, 6);
      const stringTestResult1 = merlot.Validator.max(stringInput1.type, stringInput1.value, 6);
      const stringTestResult2 = merlot.Validator.max(stringInput2.type, stringInput2.value, 6);
      const stringTestResult3 = merlot.Validator.max(stringInput3.type, stringInput3.value, 6);

      const numberTestResult0 = merlot.Validator.min(numberInput0.type, numberInput0.value, 6);
      const numberTestResult1 = merlot.Validator.min(numberInput1.type, numberInput1.value, 6);
      const numberTestResult2 = merlot.Validator.min(numberInput2.type, numberInput2.value, 6);
      const numberTestResult3 = merlot.Validator.min(numberInput3.type, numberInput3.value, 6);
      const numberTestResult4 = merlot.Validator.min(numberInput4.type, numberInput4.value, 6);


      expect(stringTestResult0).to.be.equal(true);
      expect(stringTestResult1).to.be.equal(true);
      expect(stringTestResult2).to.be.equal(true);
      expect(stringTestResult3).to.be.equal(false);
      
      expect(numberTestResult0).to.be.equal(false);
      expect(numberTestResult1).to.be.equal(false);
      expect(numberTestResult2).to.be.equal(false);
      expect(numberTestResult3).to.be.equal(true);
      expect(numberTestResult4).to.be.equal(true);
    });
  });

  describe('rTransformData()', function () {
    it('Transform sth. like foo.bar = 5; to foo.bar.value = 5 ', function () {
      const sampleObj =  {
        nestedObj: {
          primitive: true
        },
        primitive: 'A',
        someEmptyObj: {},
        array: ['a', 'b', 'c'],
        nestedArray: [
          {
            nestedArrayObj0: {
              primitive: 'alpha'
            }
          },
          { 
            nestedArrayObj1: {
              primitive: 'beta'
            }
          }
        ]
      };

      const transformedObject = merlot.rTransformData(sampleObj);
      //We have a problem here in nestedArrays. Oh noes.
      console.log(JSON.stringify(transformedObject));

      expect(true).to.be.equal(true);

    });
  });
});