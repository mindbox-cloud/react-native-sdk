To run the example application with functioning mobile push notifications (complete only step 5 for in-app functionality to work), follow these steps:

1) Change the package identifier in the **app/build.gradle** file in Android
   Change team and bundle identifier and App Groups name in iOS for next targets:
    - exampleApp
    - MindboxNotificationServiceExtension
    - MindboxNotificationContentExtension

   Tip: app group name template: group.cloud.Mindbox.<your_bundle_id>

2) Add your application to either Firebase or Huawei project, following the instructions provided at:
   [Firebase Key Generation](https://developers.mindbox.ru/docs/firebase-get-keys) /
   [Huawei Key Generation](https://developers.mindbox.ru/docs/huawei-get-keys)
   or add app in your existing project for Android

   [Get keys and configuring APNS](https://developers.mindbox.ru/docs/ios-get-keys) for iOS

3) Copy the **google-services.json** file (for Firebase) or/and **agcconnect-services.json** file (for Huawei) into the app folder of your project

4) Configure your endpoints [iOS](https://developers.mindbox.ru/docs/add-ios-integration), [Android](https://developers.mindbox.ru/docs/add-android-integration)

5) Set your domain and endpoints in the HomeScreen.tsx within the configuration builder

6) Run the application

7) After 5 minutes check your user in your Mindbox admin site

7) Run in-app and send mobile push
