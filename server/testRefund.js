
/* global require, process */

require('dotenv').config();

const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

async function testRefund() {
  try {
    const paymentId = 'pay_Ta0E3TtWmfk4Y3';

    console.log('Testing Razorpay refund...');
    console.log('Payment ID:', paymentId);

    const refund = await razorpay.payments.refund(paymentId, {
      amount: 300000
    });

    console.log('================================');
    console.log('REFUND SUCCESS');
    console.log('Refund ID:', refund.id);
    console.log('Amount:', refund.amount);
    console.log('Status:', refund.status);
    console.log('================================');

  } catch (error) {
    console.log('================================');
    console.log('REFUND FAILED');
    console.log('Status:', error.statusCode);
    console.log('Code:', error.error?.code);
    console.log('Description:', error.error?.description);
    console.log('Reason:', error.error?.reason);
    console.log('Source:', error.error?.source);
    console.log('Step:', error.error?.step);
    console.log('Full Error:', error);
    console.log('================================');
  }
}

testRefund();