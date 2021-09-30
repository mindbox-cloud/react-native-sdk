import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Formik, FormikProps, useFormikContext } from 'formik';
import * as Yup from 'yup';
import MindboxSdk from 'mindbox-sdk';

import { styles } from './Configuration.styles';
import type { FormikIsValidProps, Props } from './Configuration.types';

const initialValues = {
  domain: 'api.mindbox.ru',
  endpointId:
    Platform.OS === 'ios' ? 'mpush-test-iOS-test' : 'mpush-test-Android',
  subscribeCustomerIfCreated: true,
  shouldCreateCustomer: true,
  previousInstallId: '',
  previousUuid: '',
};

const validationSchema = Yup.object().shape({
  domain: Yup.string().required("Can't be empty"),
  endpointId: Yup.string().required("Can't be empty"),
  previousInstallId: Yup.string(),
  previousUuid: Yup.string(),
});

const FormikIsValid: FC<FormikIsValidProps> = (props) => {
  const { onIsValidChange } = props;
  const { isValid } = useFormikContext();

  useEffect(() => {
    onIsValidChange(!isValid);
  }, [isValid, onIsValidChange]);

  return null;
};

const Configuration: FC<Props> = (props) => {
  const { navigation } = props;

  const [rightButtonDisabled, setRightButtonDisabled] = useState(false);

  const formikRef = useRef<FormikProps<typeof initialValues>>(null);

  const onFormSubmit = (formValues: typeof initialValues) => {
    MindboxSdk.initialize(formValues)
      .then(() => {
        navigation.navigate('Methods');
      })
      .catch((error) => {
        Alert.alert('Error', JSON.stringify(error));
      });
  };

  const renderRightButton = useCallback(() => {
    if (!formikRef.current) {
      return null;
    }

    if (MindboxSdk.initialized) {
      return (
        <Button title="Next" onPress={() => navigation.navigate('Methods')} />
      );
    }

    return (
      <Button
        title="Initialize"
        onPress={formikRef.current?.handleSubmit}
        disabled={rightButtonDisabled}
      />
    );
  }, [navigation, rightButtonDisabled]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: renderRightButton,
    });
  }, [navigation, renderRightButton]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView>
        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={onFormSubmit}
        >
          {({ handleChange, setFieldValue, handleBlur, values, errors }) => (
            <View style={styles.formWrapper}>
              <View style={styles.textFieldWrapper}>
                <Text style={styles.textFieldTitle}>Domain</Text>
                <TextInput
                  style={styles.textFieldInput}
                  blurOnSubmit={true}
                  autoCapitalize="none"
                  spellCheck={false}
                  autoCorrect={false}
                  autoCompleteType="off"
                  keyboardType="url"
                  onBlur={handleBlur('domain')}
                  onChangeText={handleChange('domain')}
                  value={values.domain}
                />
                {!!errors.domain && (
                  <Text style={styles.textFieldErrors}>{errors.domain}</Text>
                )}
              </View>
              <View style={styles.textFieldWrapper}>
                <Text style={styles.textFieldTitle}>Endpoint ID</Text>
                <TextInput
                  style={styles.textFieldInput}
                  blurOnSubmit
                  autoCapitalize="none"
                  spellCheck={false}
                  autoCorrect={false}
                  autoCompleteType="off"
                  onBlur={handleBlur('endpointId')}
                  onChangeText={handleChange('endpointId')}
                  value={values.endpointId}
                />
                {!!errors.endpointId && (
                  <Text style={styles.textFieldErrors}>
                    {errors.endpointId}
                  </Text>
                )}
              </View>
              <View style={styles.textFieldWrapper}>
                <Text style={styles.textFieldTitle}>
                  Previous Installation ID
                </Text>
                <TextInput
                  style={styles.textFieldInput}
                  blurOnSubmit
                  autoCapitalize="none"
                  spellCheck={false}
                  autoCorrect={false}
                  autoCompleteType="off"
                  onBlur={handleBlur('previousInstallId')}
                  onChangeText={handleChange('previousInstallId')}
                  value={values.previousInstallId}
                />
                {!!errors.previousInstallId && (
                  <Text style={styles.textFieldErrors}>Errors</Text>
                )}
              </View>
              <View style={styles.textFieldWrapper}>
                <Text style={styles.textFieldTitle}>Previous device UUID</Text>
                <TextInput
                  style={styles.textFieldInput}
                  blurOnSubmit
                  autoCapitalize="none"
                  spellCheck={false}
                  autoCorrect={false}
                  autoCompleteType="off"
                  onBlur={handleBlur('previousUuid')}
                  onChangeText={handleChange('previousUuid')}
                  value={values.previousUuid}
                />
                {!!errors.previousUuid && (
                  <Text style={styles.textFieldErrors}>Errors</Text>
                )}
              </View>
              <View style={styles.switchFieldWrapper}>
                <Text style={styles.switchFieldTitle}>
                  Subscribe customer if created
                </Text>
                <Switch
                  value={values.subscribeCustomerIfCreated}
                  onValueChange={(value) =>
                    setFieldValue('subscribeCustomerIfCreated', value)
                  }
                />
              </View>
              <View style={styles.switchFieldWrapper}>
                <Text style={styles.switchFieldTitle}>
                  Should create customer
                </Text>
                <Switch
                  value={values.shouldCreateCustomer}
                  onValueChange={(value) =>
                    setFieldValue('shouldCreateCustomer', value)
                  }
                />
              </View>
              <FormikIsValid onIsValidChange={setRightButtonDisabled} />
            </View>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Configuration;
