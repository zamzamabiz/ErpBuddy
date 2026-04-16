module.exports = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
