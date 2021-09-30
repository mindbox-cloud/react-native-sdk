import MindboxSdk from 'mindbox-sdk';
import React, { FC, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Formik, FormikProps } from 'formik';
import * as Yup from 'yup';

import { styles } from './Methods.styles';
import type { Props } from './Methods.types';

const validationSchema = Yup.object().shape({
  token: Yup.string().required("Can't be empty"),
});

const initialValues = {
  token: '',
};

const Methods: FC<Props> = () => {
  const [deviceUUID, setDeviceUUID] = useState('');
  const [tokenValue, setTokenValue] = useState('');

  const formikRef = useRef<FormikProps<typeof initialValues>>(null);

  const getDeviceUUIDHandle = () => {
    MindboxSdk.getDeviceUUID((uuid) => setDeviceUUID(uuid));
  };

  const getTokenHandle = () => {
    MindboxSdk.getToken((token) => setTokenValue(token || ''));
  };

  const onFormSubmit = (formValues: typeof initialValues) => {
    MindboxSdk.updateToken(formValues.token)
      .then(() => {
        formikRef.current?.resetForm();
        MindboxSdk.getToken((newToken) => setTokenValue(newToken));
      })
      .catch((error) => {
        Alert.alert('Error', JSON.stringify(error));
      });
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView>
        <View style={styles.contentWrapper}>
          <View style={styles.infoFieldWrapper}>
            <View style={styles.infoFieldTitleWrapper}>
              <Text style={styles.infoFieldTitle}>Current device UUID</Text>
              <Button
                title={deviceUUID ? 'Update' : 'Get'}
                onPress={getDeviceUUIDHandle}
              />
            </View>
            <Text style={styles.infoFieldContent}>{deviceUUID}</Text>
          </View>
          <View style={styles.infoFieldWrapper}>
            <View style={styles.infoFieldTitleWrapper}>
              <Text style={styles.infoFieldTitle}>
                Current {Platform.OS === 'android' ? 'FMS' : 'APNS'} token
              </Text>
              <Button
                title={tokenValue ? 'Update' : 'Get'}
                onPress={getTokenHandle}
              />
            </View>
            <Text style={styles.infoFieldContent}>{tokenValue}</Text>
          </View>
          <Formik
            innerRef={formikRef}
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={onFormSubmit}
          >
            {({
              handleChange,
              handleBlur,
              handleSubmit,
              values,
              errors,
              isValid,
            }) => (
              <View style={styles.formWrapper}>
                <View style={styles.textFieldWrapper}>
                  <Text style={styles.textFieldTitle}>
                    New {Platform.OS === 'android' ? 'FMS' : 'APNS'} token
                  </Text>
                  <TextInput
                    style={styles.textFieldInput}
                    autoCapitalize="none"
                    spellCheck={false}
                    autoCorrect={false}
                    autoCompleteType="off"
                    keyboardType="url"
                    onBlur={handleBlur('token')}
                    onChangeText={handleChange('token')}
                    onEndEditing={handleSubmit}
                    value={values.token}
                  />
                  {!!errors.token && (
                    <Text style={styles.textFieldErrors}>{errors.token}</Text>
                  )}
                </View>
                <Button
                  title="Set"
                  onPress={handleSubmit}
                  disabled={!isValid || !values.token.length}
                />
              </View>
            )}
          </Formik>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Methods;
