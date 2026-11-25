import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';

import {
  BienvenidaScreen,
  LoginScreen,
  RegistroScreen,
  EmpresaSeleccionScreen,
  InicioScreen,
  ProductosScreen,
  ProductoFormScreen,
  VenderScreen,
  HistorialScreen,
  VentaDetalleScreen,
  PerfilScreen,
  CajaScreen,
  CategoriasScreen,
  MovimientosInventarioScreen,
  HistorialCajaScreen,
  ProductosEliminadosScreen,
  ConfiguracionScreen,
  LicenciaVencidaScreen,
} from './src/screens';

import { BarraPestanas } from './src/components/organisms';

import { ESTADO, useLicencia } from './src/services/licencia';
import { ConfiguracionProvider, SesionProvider } from './src/context';
import { iniciarBD } from './src/database';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function NavegadorPrincipal() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BarraPestanas {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Inicio"
    >
      <Tab.Screen name="Inicio" component={InicioScreen} />
      <Tab.Screen name="Productos" component={ProductosScreen} />
      <Tab.Screen name="Vender" component={VenderScreen} />
      <Tab.Screen name="Historial" component={HistorialScreen} />
      <Tab.Screen name="Caja" component={CajaScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const estadoLicencia = useLicencia();

  if (estadoLicencia !== ESTADO.ACTIVA) {
    return <LicenciaVencidaScreen estado={estadoLicencia} />;
  }

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="nexcash.db" onInit={iniciarBD}>
        <ConfiguracionProvider>
          <SesionProvider>
            <StatusBar style="light" />
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Bienvenida"
                screenOptions={{
                  headerShown: false,
                  animation: 'slide_from_right',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  fullScreenGestureEnabled: true,
                }}
              >
                <Stack.Screen name="Bienvenida" component={BienvenidaScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Registro" component={RegistroScreen} />
                <Stack.Screen name="EmpresaSeleccion" component={EmpresaSeleccionScreen} />
                <Stack.Screen name="Principal" component={NavegadorPrincipal} />
                <Stack.Screen name="ProductoForm" component={ProductoFormScreen} />
                <Stack.Screen name="VentaDetalle" component={VentaDetalleScreen} />
                <Stack.Screen name="Perfil" component={PerfilScreen} />
                <Stack.Screen name="Categorias" component={CategoriasScreen} />
                <Stack.Screen name="MovimientosInventario" component={MovimientosInventarioScreen} />
                <Stack.Screen name="HistorialCaja" component={HistorialCajaScreen} />
                <Stack.Screen
                  name="ProductosEliminados"
                  component={ProductosEliminadosScreen}
                />
                <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </SesionProvider>
        </ConfiguracionProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}
