module.exports = {
  project: {
    ios: {},
    android: {},
  },
  dependency: {
    platforms: {
      android: {
        packageInstance: 'new VoicePackage()',
      },
      ios: {},
    },
  },
};
