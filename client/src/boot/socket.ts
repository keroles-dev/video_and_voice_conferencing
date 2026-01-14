import { defineBoot } from '#q-app/wrappers';
import { createSocket } from 'src/helpers/socketFactory';

export default defineBoot(({ app }) => {
  app.config.globalProperties.$createSocket = createSocket;
});
