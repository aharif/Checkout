import messaging from '@react-native-firebase/messaging';
import { AsyncStorage } from 'react-native';
// import Api from './Api';

export default class FCM {
  static myInstance = null;
  notifyUser: (title, message) => {};

  // /**
  //  * @returns {Api}
  //  */
  static instance() {
    if (FCM.myInstance == null) {
      FCM.myInstance = new FCM();
    }
    return this.myInstance;
  }

  appInit() {

    this.checkPermission();
  }

  async checkPermission() {

    const authStatus = await messaging().requestPermission();

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      this.getToken();
      await this.createNotificationListeners();
    } else {
      this.requestPermission();
    }
  }

  async getToken() {
    console.log("FCM")
    let fcmToken = '';
    try {
      fcmToken = await messaging().getToken();
    } catch (error) {
      console.error(error);
    }
    console.warn("fcm token :: ",fcmToken)
    if (fcmToken) {
      await AsyncStorage.setItem('fcmToken', fcmToken);
      console.log("TOKEN IS SET")
     // await Api.instance().updateFcmToken(fcmToken);
    }
  }

  async requestPermission() {
    try {
      await messaging().requestPermission();
      // User has authorised
      this.getToken();
    } catch (error) {
      // User has rejected permissions
      console.log('permission rejected');
    }
  }

  appDesroyed() {
    console.warn('appDesroyed', 'appDesroyed');
    if (this.notificationListener) {
      this.notificationListener();
      this.notificationOpenedListener();
    }
  }

  async createNotificationListeners() {
    console.warn('createNotificationListeners');
    /*
     * Triggered when a particular notification has been received in foreground
     * */
    // this.notificationListener = messaging()
    //   .onNotification(notification => {
    //     this.onMessage(null, notification._data);
    //   });

    /*
     * If your app is in background, you can listen for when a notification is clicked / tapped / opened as follows:
     * */
    this.notificationOpenedListener = messaging().onNotificationOpenedApp(
      notificationOpen => {

        this.onMessage(null, notificationOpen.notification._data);
      },
    );

    /*
     * If your app is closed, you can check if it was opened by a notification being clicked / tapped / opened as follows:
     * */
    const notificationOpen = await messaging()
      .getInitialNotification();

    if (notificationOpen) {
      this.onMessage(null, notificationOpen.notification._data);
    }

    messaging().setBackgroundMessageHandler(async remoteMessage => {

      this.onMessage(null, remoteMessage.notification._data);
    });

    /*
     * Triggered for data only payload in foreground
     * */
    this.messageListener = messaging().onMessage(async message => {

      //process data message
      this.onMessage(null, message);
    });
  }

  onMessage(title, body) {

    if (this.notifyUser) {
      this.notifyUser(title, body);
    }
  }
}
