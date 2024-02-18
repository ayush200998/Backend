import mongoose, { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
  subscriber: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const Subscription = mongoose.model('Subscriptions', subscriptionSchema);

export default Subscription;
