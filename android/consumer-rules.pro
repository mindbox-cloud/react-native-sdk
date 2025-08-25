-keep class com.facebook.react.ReactHost { *; }
-keep interface com.facebook.react.ReactInstanceEventListener { *; }
-keep interface com.facebook.react.ReactApplication {
  public com.facebook.react.ReactHost getReactHost();
}
