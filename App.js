import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Image,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  Modal,
  Dimensions
} from 'react-native';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from '@expo/vector-icons/Ionicons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import axios from 'axios';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import Swiper from 'react-native-swiper';


// Firebase Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, addDoc, collection, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- Brand Colors ---
const brandColors = {
  primary: '#00bfff',
  background: '#000000',
  text: '#FFFFFF',
  inputBackground: '#111',
  secondaryText: '#ccc',
  accent: '#007ACC',
  darkBlue: '#0A1A2F',
  skeleton: '#222', 
};

// --- Firebase & API Configuration ---
const firebaseConfig = {
  apiKey: "REDACTED_GAPI_KEY", // Remember to use your own key
  authDomain: "scenesnitch.firebaseapp.com",
  projectId: "scenesnitch",
  storageBucket: "scenesnitch.appspot.com",
  messagingSenderId: "1066217988518",
  appId: "1:1066217988518:web:290c9b551b6c236431ef67"
};
const TMDB_API_KEY = '62c44c70edbad470bdc9375fe86284aa';

// --- Robust Firebase Initialization ---
let app;
let auth;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} else {
  app = getApp();
  auth = getAuth(app);
}
const db = getFirestore(app);
const storage = getStorage(app);

// --- Locations Data ---
const defaultLocations = [
    { title: 'Under the Bridge', type: 'TV series', country: 'Canada', city: 'Vancouver / Saanich BC', scene: 'Richmond White Studios Fraserwood, North Vancouver Allied Shipyard, Colquitz Middle School', latitude: 49.1708, longitude: -123.1368 },
    { title: 'The Last of Us S2', type: 'TV series', country: 'Canada', city: 'British Columbia', scene: 'Vancouver (B‑rock), Britannia Beach, Langley, Whistler, Nanaimo, Stanley Park & Aquarium (simulated Seattle)', latitude: 49.2827, longitude: -123.1207 },
    { title: 'Charmed (2018)', type: 'TV series', country: 'Canada', city: 'Vancouver BC', scene: 'Whites Ironwood Studios; Vernon J. E. Phillips House, UBC Point Grey campus', latitude: 49.2606, longitude: -123.2460 },
    { title: 'Virgin River', type: 'TV series', country: 'Canada', city: 'Bowen Island / Squamish BC', scene: 'Snug Cove, Watershed Grill (Squamish), Agassiz', latitude: 49.3800, longitude: -123.3110 },
    { title: 'Untamed', type: 'TV series', country: 'Canada', city: 'BC', scene: 'Squamish & Port Moody: Chip Kerr Park, Mount Seymour, Murdo Frazier Park, Sea‑to‑Sky Gondola, Port Moody streets', latitude: 49.3300, longitude: -123.0700 },
    { title: 'MacGyver (S3–6)', type: 'TV series', country: 'Canada', city: 'Vancouver BC', scene: 'Coal Harbour waterfront locations doubling LA', latitude: 49.2948, longitude: -123.1350 },
    { title: 'Game of Thrones', type: 'multiple', country: 'Canada', city: 'Banff AB', scene: 'Rockies — also used in Dr. Strangelove, Due South, Jasper region', latitude: 51.1784, longitude: -115.5708 },
    { title: 'El Mariachi', type: 'film', country: 'Mexico', city: 'Ciudad Acuña Coahuila', scene: 'Hidalgo Street, Acuña jail, Boy’s Town district', latitude: 29.3244, longitude: -100.9562 },
    { title: 'Narcos: Mexico', type: 'TV/film', country: 'Mexico', city: 'Nezahualcóyotl (E of Mexico City)', scene: 'Av. Chimalhuacán / C.3 overpass, used in series featuring Juárez', latitude: 19.4217, longitude: -99.0539 },
    { title: 'Dark Winds', type: 'TV series', country: 'USA', city: 'New Mexico / Navajo Nation', scene: 'Camel Rock Studios, NM', latitude: 35.8216, longitude: -105.9742 },
    { title: 'Dark Winds', type: 'TV series', country: 'USA', city: 'New Mexico / Navajo Nation', scene: 'Española, NM', latitude: 36.0063, longitude: -106.0796 },
    { title: 'Dark Winds', type: 'TV series', country: 'USA', city: 'New Mexico / Navajo Nation', scene: 'Kayenta, AZ (Navajo)', latitude: 36.7126, longitude: -110.2568 },
    { title: 'Dark Winds', type: 'TV series', country: 'USA', city: 'New Mexico / Navajo Nation', scene: 'Mexican Hat, UT', latitude: 37.1730, longitude: -109.8751 },
    { title: 'Dark Winds', type: 'TV series', country: 'USA', city: 'New Mexico / Navajo Nation', scene: 'Monument Valley Navajo Tribal Park', latitude: 36.9829, longitude: -110.1127 },
    { title: 'Dark Winds', type: 'TV series', country: 'USA', city: 'New Mexico / Navajo Nation', scene: 'Pueblo de Cochiti, NM', latitude: 35.6215, longitude: -106.3567 },
    { title: 'Dark Winds', type: 'TV series', country: 'USA', city: 'New Mexico / Navajo Nation', scene: 'Santa Fe, NM', latitude: 35.6703, longitude: -105.9761 },
    { title: 'Outer Banks', type: 'TV series', country: 'USA', city: 'North Carolina (Charleston & Wilmington)', scene: 'Charleston', latitude: 32.7774, longitude: -79.9357 },
    { title: 'Outer Banks', type: 'TV series', country: 'USA', city: 'North Carolina (Charleston & Wilmington)', scene: 'Hunting Island Lighthouse', latitude: 32.3756, longitude: -80.4377 },
    { title: 'Outer Banks', type: 'TV series', country: 'USA', city: 'North Carolina (Charleston & Wilmington)', scene: 'Kiawah Island', latitude: 32.6083, longitude: -80.0885 },
    { title: 'Outer Banks', type: 'TV series', country: 'USA', city: 'North Carolina (Charleston & Wilmington)', scene: 'McClellanville', latitude: 33.0882, longitude: -79.4688 },
    { title: 'Outer Banks', type: 'TV series', country: 'USA', city: 'North Carolina (Charleston & Wilmington)', scene: 'Morris Island Lighthouse', latitude: 32.6953, longitude: -79.8837 },
    { title: 'Outer Banks', type: 'TV series', country: 'USA', city: 'North Carolina (Charleston & Wilmington)', scene: 'Mount Pleasant / Shem Creek', latitude: 32.8139, longitude: -79.8537 },
    { title: 'The Summer I Turned Pretty', type: 'TV series', country: 'USA', city: 'North Carolina (Wilmington, Carolina Beach, Wrightsville Beach)', scene: 'Cousins Beach / beach house', latitude: 34.2266, longitude: -77.9447 },
    { title: 'One Tree Hill', type: 'TV series', country: 'USA', city: 'North Carolina (Wilmington)', scene: 'UNCW campus / USS North Carolina', latitude: 34.2260, longitude: -77.9450 },
    { title: 'The Hunting Wives', type: 'TV series', country: 'USA', city: 'North Carolina (Charlotte/Mooresville)', scene: 'Downtown, restaurant & lake sites', latitude: 35.2271, longitude: -80.8431 },
    { title: 'The Last Song', type: 'Film', country: 'USA', city: 'Georgia (Tybee Island & Savannah)', scene: 'Beach & pier', latitude: 32.0195, longitude: -81.0306 },
    { title: 'Forrest Gump', type: 'Film', country: 'USA', city: 'Georgia (Savannah)', scene: 'Chippewa Square bench', latitude: 32.0783, longitude: -81.0936, youtubeId: 'a_saUNX8_1k' },
    { title: 'Midnight in the Garden of Good and Evil', type: 'Various', country: 'USA', city: 'Georgia (Savannah, Columbus, Rome etc)', scene: 'Multiple productions', latitude: 32.0809, longitude: -81.0912 },
    { title: 'Bull Durham', type: 'Film', country: 'USA', city: 'North Carolina (Durham)', scene: 'Durham Athletic Park', latitude: 35.9976, longitude: -78.9003 },
    { title: 'Crimes of the Heart', type: 'Film', country: 'USA', city: 'North Carolina (Southport area)', scene: 'Brunswick County coastal towns', latitude: 34.0229, longitude: -77.9440 },
    { title: 'American Honey', type: 'Film', country: 'USA', city: 'Nebraska (Bennington, Grand Island)', scene: 'Bennington/Grand Island', latitude: 41.1541, longitude: -98.0353 },
    { title: 'It Snows All the Time', type: 'Film', country: 'USA', city: 'Nebraska (Omaha & Fremont)', scene: 'Omaha/Fremont area', latitude: 41.2572, longitude: -96.0270 },
    { title: 'Midnight Kiss', type: 'Film', country: 'USA', city: 'Nebraska (Lincoln)', scene: 'Lincoln city', latitude: 40.8136, longitude: -96.7026 },
    { title: 'As Above, So Below', type: 'Film', country: 'France', city: 'Paris (catacombs)', scene: '10 Rue des Lombards', latitude: 48.859165, longitude: 2.349859 },
    { title: 'As Above, So Below', type: 'Film', country: 'France', city: 'Paris (catacombs)', scene: 'Les Catacombes', latitude: 48.833820, longitude: 2.332336 },
    { title: 'Portrait of a Lady on Fire', type: 'Film', country: 'France', city: 'Brittany (Saint‑Pierre Quiberon / Brech)', scene: 'Brech coastal roads', latitude: 47.719147, longitude: -3.002499 },
    { title: 'Portrait of a Lady on Fire', type: 'Film', country: 'France', city: 'Brittany (Saint‑Pierre Quiberon)', scene: 'Château de La Chapelle‑Gauthier', latitude: 48.550777, longitude: 2.901164 },
    { title: 'Time', type: 'TV series', country: 'UK', city: 'England (Liverpool, Shrewsbury, Southport)', scene: 'Multiple sites incl prison & bridge', latitude: 53.381557, longitude: -2.864501 },
    { title: 'North & South', type: 'TV series', country: 'UK', city: 'Scotland (Edinburgh) & England', scene: 'Edinburgh New Town', latitude: 52.9810, longitude: -3.1900 },
    { title: 'Broadchurch', type: 'TV series', country: 'UK', city: 'England (West Bay, Clevedon, Bridport)', scene: 'West Bay Harbour Cliff Beach', latitude: 50.6820, longitude: -2.7580 },
    { title: 'Bourne Wood', type: 'Film/TV', country: 'UK', city: 'England (Surrey Bourne Wood)', scene: 'Forest battle settings (Gladiator, House of the Dragon)', latitude: 51.216, longitude: -0.750 },
    { title: 'The Godfather', scene: "St. Patrick's Old Cathedral, New York – Funeral scene", latitude: 40.7228, longitude: -73.9961, youtubeId: 'EwUil_lG_qA' },
    { title: 'Breaking Bad', scene: 'Twisters Burger & Burrito (Los Pollos Hermanos)', latitude: 35.0084, longitude: -106.6974, youtubeId: 'pOM_V_39p7M' },
    { title: 'Back to the Future', scene: 'Puente Hills Mall – Twin Pines Mall/Lone Pine Mall', latitude: 33.9935, longitude: -117.928, youtubeId: '3_E8I2B2H4s' },
    { title: 'La La Land', scene: 'Angels Flight Railway – Downtown LA', latitude: 34.0522, longitude: -118.2506, youtubeId: 'hmR6GII4i24' },
    { title: 'Halloween', scene: 'Michael Myers House – 1000 Mission St, South Pasadena', latitude: 34.1159, longitude: -118.1534, youtubeId: '8Z6ShG_eW_A' },
    { title: 'Greenland', scene: 'Warner Robins, GA – City Center', latitude: 32.618, longitude: -83.626 },
    { title: 'License to Kill', scene: 'Key West, FL – Southernmost Point Buoy', latitude: 24.552, longitude: -81.795 },
    { title: 'Citizen Ruth', scene: "4949 Underwood Ave – Ruth's Hardware Store Scene", latitude: 41.2612, longitude: -96.027 },
    { title: 'Citizen Ruth', scene: "2454 Harney St – Boyfriend's Apartment", latitude: 41.2581, longitude: -95.9542 },
    { title: 'Citizen Ruth', scene: '411 Hickory St – Brother’s House', latitude: 41.2526, longitude: -95.9392 },
    { title: 'Citizen Ruth', scene: 'Council Bluffs, IA – Abortion Clinic Alley', latitude: 41.259361, longitude: -95.890616 },
    { title: 'Full Circle (Indie)', scene: 'Bennettsville, SC – City Center', latitude: 34.621, longitude: -79.684 },
    { title: 'Pau – Filming Backdrop', scene: 'Pau, Pyrénées-Atlantiques, France – City Center', latitude: 43.295, longitude: -0.37 },
    { title: 'Montpellier – General Use in Cinema', scene: 'Place de la Comédie – Montpellier, France', latitude: 43.611, longitude: 3.874 },
    { title: 'Spirited Away', scene: 'Edo-Tokyo Open Air Architectural Museum – Inspiration for bathhouse', latitude: 35.7003, longitude: 139.5085 },
    { title: 'Amelie', scene: 'Café des Deux Moulins – Amelie’s workplace', latitude: 48.8824, longitude: 2.3339 },
    { title: 'Training Day', scene: 'Imperial Courts Housing Project – Watts', latitude: 33.9386, longitude: -118.2437 },
    { title: 'Training Day', scene: 'Baldwin Village (The Jungle)', latitude: 34.0105, longitude: -118.3319 },
    { title: 'Training Day', scene: '1031 Everett Street – Roger’s House (Echo Park)', latitude: 34.0778, longitude: -118.2529 },
    { title: 'Training Day', scene: 'Parisian Wigs, 4102 Crenshaw Blvd', latitude: 34.0122, longitude: -118.3316 },
    { title: 'Training Day', scene: 'Pacific Dining Car – 1310 W 6th St', latitude: 34.0535, longitude: -118.2678 },
    { title: 'Training Day', scene: 'Palmwood Drive – MLK Jr Blvd', latitude: 34.0097, longitude: -118.312 },
    { title: 'Blood In Blood Out', scene: 'Los Cinco Puntos – East LA', latitude: 34.0446, longitude: -118.1973 },
    { title: 'Blood In Blood Out', scene: 'El Pino – Indiana & Folsom', latitude: 34.0425, longitude: -118.1846 },
    { title: 'Blood In Blood Out', scene: 'Near 4th & Chicago – Smokey phone call scene', latitude: 34.0416, longitude: -118.2124 },
    { title: 'Blood In Blood Out', scene: 'Evergreen Cemetery – East LA', latitude: 34.0448, longitude: -118.1879 },
    { title: 'Blade Runner', scene: 'Bradbury Building – 304 S Broadway', latitude: 34.0505, longitude: -118.2478 },
    { title: 'A Nightmare on Elm Street', scene: 'Nancy’s House – 1428 N Genesee Ave', latitude: 34.0983, longitude: -118.3446 },
    { title: 'Halloween', scene: 'Laurie Strode’s House – 1115 Oxley St, South Pasadena', latitude: 34.1139, longitude: -118.1506 },
    { title: 'The Big Lebowski', scene: 'Sheats-Goldstein Residence – Jackie Treehorn’s House', latitude: 34.0896, longitude: -118.439 },
    { title: 'Poltergeist', scene: 'Poltergeist House – 4267 Roxbury Dr, Simi Valley', latitude: 34.281, longitude: -118.746 },
    { title: 'Pulp Fiction', scene: 'Crown Pawn Shop – 7606 Reseda Blvd, Canoga Park', latitude: 34.2073, longitude: -118.5365 },
];


// --- Reusable Components ---
const LogoTitle = () => (
  <Image
    style={{ width: 150, height: 40, marginTop: 10 }}
    resizeMode="contain"
    source={require('./assets/SceneSnitch.png')}
  />
);

const EmptyState = ({ icon, title, message }) => (
    <View style={emptyStateStyles.container}>
        <Icon name={icon} size={60} color={brandColors.secondaryText} />
        <Text style={emptyStateStyles.title}>{title}</Text>
        <Text style={emptyStateStyles.message}>{message}</Text>
    </View>
);

const ShowtimeSkeleton = () => (
    <View style={showtimeStyles.movieItem}>
        <View style={[showtimeStyles.poster, { backgroundColor: brandColors.skeleton }]} />
        <View style={showtimeStyles.textContainer}>
            <View style={{ backgroundColor: brandColors.skeleton, height: 20, width: '80%', borderRadius: 4 }} />
            <View style={{ backgroundColor: brandColors.skeleton, height: 14, width: '100%', marginTop: 8, borderRadius: 4 }} />
            <View style={{ backgroundColor: brandColors.skeleton, height: 14, width: '90%', marginTop: 4, borderRadius: 4 }} />
        </View>
    </View>
);

const ProfileSkeleton = () => (
    <View style={{ padding: 20 }}>
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: brandColors.skeleton }} />
            <View style={{ height: 20, width: 200, backgroundColor: brandColors.skeleton, marginTop: 15, borderRadius: 4 }} />
        </View>
        <View style={{ height: 20, width: 120, backgroundColor: brandColors.skeleton, marginTop: 20, borderRadius: 4 }} />
        <View style={{ height: 50, width: '100%', backgroundColor: brandColors.skeleton, marginTop: 10, borderRadius: 8 }} />
        <View style={{ height: 20, width: 120, backgroundColor: brandColors.skeleton, marginTop: 20, borderRadius: 4 }} />
        <View style={{ height: 100, width: '100%', backgroundColor: brandColors.skeleton, marginTop: 10, borderRadius: 8 }} />
    </View>
);


// --- Screens ---

const OnboardingScreen = ({ onComplete }) => {
    const swiperRef = useRef(null);
    return (
        <Swiper 
            ref={swiperRef}
            style={onboardingStyles.wrapper} 
            showsButtons={false}
            loop={false}
            activeDotColor={brandColors.primary}
        >
            <View style={onboardingStyles.slide}>
                <Icon name="search-circle-outline" size={150} color={brandColors.primary} />
                <Text style={onboardingStyles.title}>Search Scenes</Text>
                <Text style={onboardingStyles.text}>Find the exact locations where your favorite movies and TV shows were filmed.</Text>
            </View>
            <View style={onboardingStyles.slide}>
                <Icon name="navigate-circle-outline" size={150} color={brandColors.primary} />
                <Text style={onboardingStyles.title}>Discover Nearby</Text>
                <Text style={onboardingStyles.text}>Get notified when you're near a famous filming location and explore the area.</Text>
            </View>
            <View style={onboardingStyles.slide}>
                <Icon name="heart-circle-outline" size={150} color={brandColors.primary} />
                <Text style={onboardingStyles.title}>Collect Your Favorites</Text>
                <Text style={onboardingStyles.text}>Save your favorite scenes to your profile and build your collection of cinematic spots.</Text>
                <TouchableOpacity style={onboardingStyles.doneButton} onPress={onComplete}>
                    <Text style={onboardingStyles.doneButtonText}>Get Started</Text>
                </TouchableOpacity>
            </View>
        </Swiper>
    );
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = async () => {
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (error) { Alert.alert('Login Failed', 'Invalid email or password.'); }
  };
  const handleSignUp = async () => {
    try { await createUserWithEmailAndPassword(auth, email, password); Alert.alert('Account Created', 'You can now log in.'); }
    catch (error) { Alert.alert('Sign-up Failed', error.message); }
  };
  return (
    <View style={loginStyles.container}>
      <Image source={require('./assets/SceneSnitch.png')} style={loginStyles.logo} resizeMode="contain" />
      <TextInput placeholder="Email" placeholderTextColor={brandColors.secondaryText} value={email} onChangeText={setEmail} style={loginStyles.input} keyboardType="email-address" autoCapitalize="none"/>
      <TextInput placeholder="Password" placeholderTextColor={brandColors.secondaryText} value={password} onChangeText={setPassword} style={loginStyles.input} secureTextEntry/>
      <TouchableOpacity style={loginStyles.button} onPress={handleLogin}><Text style={loginStyles.buttonText}>Log In</Text></TouchableOpacity>
      <TouchableOpacity style={loginStyles.secondaryButton} onPress={handleSignUp}><Text style={loginStyles.secondaryButtonText}>Create Account</Text></TouchableOpacity>
    </View>
  );
};

const HomeScreen = ({ navigation }) => (
    <SafeAreaView style={homeStyles.container}>
      <Image
        source={require('./assets/SceneSnitch.png')}
        style={{ width: 120, height: 120, marginBottom: 20 }}
        resizeMode="contain"
      />
      <Text style={homeStyles.title}>Welcome to SceneSnitch!</Text>
      <Text style={homeStyles.subtitle}>
        Discover & Share Famous Film & TV Locations Near You
      </Text>
      
      {[
        { label: 'Search Scenes', screen: 'Search' },
        { label: 'Showtime',     screen: 'Showtime' },
        { label: 'Community',    screen: 'Community' },
        { label: 'Profile',      screen: 'Profile' },
      ].map(({ label, screen }) => (  
        <TouchableOpacity   
          key={screen}
          style={homeStyles.button}
          onPress={() => navigation.replace('Main', { screen })}
        >
          <Text style={homeStyles.buttonText}>{label}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );

const SearchScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [location, setLocation] = useState(null);
  const [radius, setRadius] = useState(5);
  const [favorites, setFavorites] = useState({});
  const mapRef = useRef(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to find nearby scenes.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            setFavorites(docSnap.data().favorites || {});
        }
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleSearch = async () => {
    if (!searchTerm) return;
    try {
      const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchTerm}`;
      const response = await axios.get(url);
      setResults(response.data.results || []);
    } catch (err) { Alert.alert('Search Error', 'Could not fetch movie data.'); }
  };

  const handleNearbyScenes = () => {
    if (!location) return;
    const nearby = defaultLocations.filter(loc => {
      const dist = getDistance({ latitude: location.latitude, longitude: location.longitude }, { latitude: loc.latitude, longitude: loc.longitude });
      return dist <= radius * 1609.34;
    });
    if (nearby.length > 0) {
      Alert.alert('Scene Snitched!', `Found ${nearby.length} scene(s) nearby!`);
      mapRef.current?.fitToCoordinates(nearby, { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 } });
    } else {
      Alert.alert('No scenes found', 'Try increasing the search radius.');
    }
  };
  
  const saveFavorite = async (movie) => {
    if (!currentUser) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedFavorites = { ...favorites };
    if (updatedFavorites[movie.id]) {
      delete updatedFavorites[movie.id];
    } else {
      updatedFavorites[movie.id] = { title: movie.title, poster_path: movie.poster_path };
    }
    setFavorites(updatedFavorites);
    const userRef = doc(db, 'users', currentUser.uid);
    await setDoc(userRef, { favorites: updatedFavorites }, { merge: true });
  };

  const openDirections = (loc) => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${loc.latitude},${loc.longitude}`;
    const label = encodeURIComponent(loc.scene);
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });
    
    Alert.alert(
        "Get Directions?",
        `Open directions to "${loc.scene}" in Maps?`,
        [
            { text: "Cancel", style: "cancel" },
            { text: "Open Maps", onPress: () => Linking.openURL(url) }
        ]
    );
  };

  const handleMovieSelect = (movie) => {
    const locations = defaultLocations.filter(
      loc => loc.title.toLowerCase() === movie.title.toLowerCase()
    );

    if (locations.length > 0) {
      const sceneWithClip = locations.find(loc => loc.youtubeId);
      const sceneToShow = sceneWithClip || locations[0];
      navigation.navigate('SceneDetail', { scene: sceneToShow, movie });
    } else {
      Alert.alert("No Locations Found", `We don't have any locations for "${movie.title}" in our database yet.`);
    }
  };

  return (
    <SafeAreaView style={searchStyles.container}>
      <View style={searchStyles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={searchStyles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation
          >
            {defaultLocations.map((loc, index) => (
              <Marker
                key={`default-${index}`}
                coordinate={{
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }}
                title={loc.title}
                description={loc.scene}
                pinColor={'green'}
                onPress={() => openDirections(loc)}
              />
            ))}
          </MapView>
        ) : (
          <View style={searchStyles.mapLoadingContainer}>
              <ActivityIndicator size="large" color={brandColors.primary} />
              <Text style={searchStyles.mapLoadingText}>Finding your location...</Text>
          </View>
        )}
      </View>
      <View style={searchStyles.controlsContainer}>
        <TextInput style={searchStyles.input} placeholder="Search for a movie..." placeholderTextColor="#ccc" value={searchTerm} onChangeText={setSearchTerm} onSubmitEditing={handleSearch} />
        <TouchableOpacity style={searchStyles.button} onPress={handleSearch}><Text style={searchStyles.buttonText}>Search Movies</Text></TouchableOpacity>
        <Text style={searchStyles.sliderLabel}>Search Radius: {radius} mi</Text>
        <Slider style={{ width: '100%', height: 40 }} minimumValue={1} maximumValue={50} step={1} value={radius} onValueChange={setRadius} minimumTrackTintColor={brandColors.primary} maximumTrackTintColor="#ccc" thumbTintColor={brandColors.primary} />
        <TouchableOpacity style={[searchStyles.button, {backgroundColor: brandColors.accent}]} onPress={handleNearbyScenes}><Text style={searchStyles.buttonText}>Find Nearby Scenes</Text></TouchableOpacity>
      </View>
      <FlatList
        style={searchStyles.list}
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={searchStyles.resultItem} onPress={() => handleMovieSelect(item)}>
            <Image 
                source={{ uri: `https://image.tmdb.org/t/p/w200${item.poster_path}` }} 
                style={searchStyles.poster}
            />
            <Text style={searchStyles.title}>{item.title}</Text>
            <TouchableOpacity 
                onPress={() => saveFavorite(item)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <Icon name={favorites[item.id] ? "heart" : "heart-outline"} size={30} color={brandColors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const ShowtimeScreen = () => {
    const [nowPlaying, setNowPlaying] = useState([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      (async () => {
        try {
          const response = await axios.get('https://api.themoviedb.org/3/movie/now_playing', {
            params: { api_key: TMDB_API_KEY, language: 'en-US', page: 1 }
          });
          setNowPlaying(response.data.results);
        } catch (error) {
          Alert.alert('Error', 'Could not fetch now playing movies.');
        } finally {
          setLoading(false);
        }
      })();
    }, []);
  
    const openTicketLink = (title) => {
      const url = `https://www.fandango.com/search?q=${encodeURIComponent(title)}`;
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open link.'));
    };
  
    if (loading) {
      return (
        <SafeAreaView style={showtimeStyles.container}>
            <Text style={showtimeStyles.header}>Now Playing in Theaters</Text>
            <ShowtimeSkeleton />
            <ShowtimeSkeleton />
            <ShowtimeSkeleton />
            <ShowtimeSkeleton />
        </SafeAreaView>
      );
    }
  
    return (
      <SafeAreaView style={showtimeStyles.container}>
        <FlatList
          data={nowPlaying}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={showtimeStyles.movieItem} onPress={() => openTicketLink(item.title)}>
              <Image 
                source={{ uri: `https://image.tmdb.org/t/p/w500${item.poster_path}` }} 
                style={showtimeStyles.poster}
              />
              <View style={showtimeStyles.textContainer}>
                  <Text style={showtimeStyles.movieTitle}>{item.title}</Text>
                  <Text style={showtimeStyles.movieOverview} numberOfLines={3}>{item.overview}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListHeaderComponent={<Text style={showtimeStyles.header}>Now Playing in Theaters</Text>}
        />
      </SafeAreaView>
    );
  };
  
const CommunityScreen = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const currentUser = auth.currentUser;
  
    const handleFilePick = async () => {
      try {
        const result = await DocumentPicker.getDocumentAsync({ type: 'video/*' });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          setFile(result.assets[0]);
        }
      } catch (error) { Alert.alert('Error', 'Failed to pick video.'); }
    };
  
    const handleSubmit = async () => {
      if (!title || !file) {
        Alert.alert('Missing Info', 'Please enter a title and upload a clip.');
        return;
      }
      if (!currentUser) {
          Alert.alert('Not Logged In', 'You must be logged in to upload a clip.');
          return;
      }
  
      setUploading(true);
      try {
        const fileRef = ref(storage, `clips/${currentUser.uid}/${Date.now()}_${file.name}`);
        const response = await fetch(file.uri);
        const blob = await response.blob();
        await uploadBytes(fileRef, blob);
        const fileURL = await getDownloadURL(fileRef);
  
        await addDoc(collection(db, `clips`), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          title,
          description,
          url: fileURL,
          createdAt: new Date()
        });
  
        Alert.alert('Success!', 'Your clip has been uploaded.');
        setTitle('');
        setDescription('');
        setFile(null);
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Error', 'Failed to upload your clip.');
      } finally {
        setUploading(false);
      }
    };
  
    return (
      <SafeAreaView style={communityStyles.container}>
          <ScrollView>
              <Text style={communityStyles.header}>Share Your Scene</Text>
              <TextInput style={communityStyles.input} placeholder="Movie or Show Title" placeholderTextColor={brandColors.secondaryText} value={title} onChangeText={setTitle} />
              <TextInput style={[communityStyles.input, { height: 80 }]} placeholder="Description (optional)" placeholderTextColor={brandColors.secondaryText} value={description} onChangeText={setDescription} multiline />
              <TouchableOpacity style={communityStyles.uploadBtn} onPress={handleFilePick}>
                  <Text style={communityStyles.uploadBtnText}>{file ? file.name : 'Upload a Clip'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={communityStyles.submitBtn} onPress={handleSubmit} disabled={uploading}>
                  {uploading ? <ActivityIndicator color="#fff" /> : <Text style={communityStyles.submitBtnText}>Submit</Text>}
              </TouchableOpacity>
          </ScrollView>
      </SafeAreaView>
    );
  };
  

const ProfileScreen = ({ navigation }) => {
  const currentUser = auth.currentUser;
  const [profile, setProfile] = useState({ displayName: '', bio: '' });
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setProfile({ displayName: userData.displayName || '', bio: userData.bio || '' });
          
          const favsArray = Object.entries(userData.favorites || {}).map(([id, data]) => ({
              id,
              ...data
          }));
          setFavorites(favsArray);
        }
        if (loading) setLoading(false);
      }, (error) => {
          console.error("Profile subscription error:", error);
          Alert.alert('Error', 'Failed to load profile data.');
          if (loading) setLoading(false);
      });

      return () => unsubscribe();
    }, [currentUser, loading])
  );

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: profile.displayName,
        bio: profile.bio
      });
      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleFavoriteSelect = (movie) => {
    const locations = defaultLocations.filter(
      loc => loc.title.toLowerCase() === movie.title.toLowerCase()
    );

    if (locations.length > 0) {
      const sceneWithClip = locations.find(loc => loc.youtubeId);
      const sceneToShow = sceneWithClip || locations[0];
      
      navigation.navigate('SceneDetail', { scene: sceneToShow, movie: movie });
    } else {
      Alert.alert("No Locations Found", `We don't have any locations for "${movie.title}" in our database yet.`);
    }
  };


  if (loading) {
    return (
        <SafeAreaView style={profileStyles.container}>
            <ProfileSkeleton />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={profileStyles.container}>
      <ScrollView>
        <View style={profileStyles.headerContainer}>
          <Icon name="person-circle-outline" size={80} color={brandColors.primary} />
          <Text style={profileStyles.email}>{currentUser?.email}</Text>
        </View>
        <Text style={profileStyles.label}>Display Name</Text>
        <TextInput style={profileStyles.input} placeholder="Your display name" placeholderTextColor="#ccc" value={profile.displayName} onChangeText={text => setProfile({ ...profile, displayName: text })} />
        <Text style={profileStyles.label}>Bio</Text>
        <TextInput style={[profileStyles.input, { height: 100 }]} placeholder="Tell us about yourself" placeholderTextColor="#ccc" value={profile.bio} onChangeText={text => setProfile({ ...profile, bio: text })} multiline />
        <TouchableOpacity style={profileStyles.button} onPress={handleSave}><Text style={profileStyles.buttonText}>Save Changes</Text></TouchableOpacity>
        <Text style={profileStyles.subheader}>Your Favorites</Text>
        
        {favorites.length > 0 ? favorites.map((fav) => (
          <TouchableOpacity key={fav.id} onPress={() => handleFavoriteSelect(fav)}>
            <View style={profileStyles.favoriteItem}>
              <Image 
                source={{ uri: `https://image.tmdb.org/t/p/w200${fav.poster_path}` }} 
                style={profileStyles.favPoster}
              />
              <Text style={profileStyles.favTitle}>{fav.title}</Text>
              <Icon name="chevron-forward-outline" size={22} color={brandColors.secondaryText} />
            </View>
          </TouchableOpacity>
        )) : (
            <EmptyState 
                icon="heart-outline"
                title="No Favorites Yet"
                message="Tap the heart icon on a movie to add it to your collection."
            />
        )}

        <TouchableOpacity style={[profileStyles.button, profileStyles.signOutButton]} onPress={() => auth.signOut()}><Text style={profileStyles.buttonText}>Sign Out</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};  


const SceneDetailScreen = ({ route }) => {
  const { scene, movie } = route.params || {};
  const [modalVisible, setModalVisible] = useState(false);

  const handleReplayScene = () => {
      if (scene.youtubeId) {
          setModalVisible(true);
      } else {
          Alert.alert("No Clip", "We don't have a clip for this scene yet.");
      }
  };

  const createYoutubeHTML = (youtubeId) => `
    <!DOCTYPE html>
    <html>
      <body style="margin:0;padding:0;overflow:hidden;background-color:#000;">
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&modestbranding=1" 
          frameborder="0" 
          allow="autoplay; encrypted-media" 
          allowfullscreen>
        </iframe>
      </body>
    </html>
  `;

  return (
    <SafeAreaView style={sceneDetailStyles.container}>
      <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
      >
          <View style={sceneDetailStyles.modalContainer}>
              <View style={sceneDetailStyles.modalView}>
                  <WebView
                      style={sceneDetailStyles.video}
                      originWhitelist={['*']}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                      source={{ html: createYoutubeHTML(scene.youtubeId) }}
                  />
                  <TouchableOpacity
                      style={[sceneDetailStyles.button, {backgroundColor: brandColors.primary, width: '100%', marginTop: 15}]}
                      onPress={() => setModalVisible(false)}
                  >
                      <Text style={sceneDetailStyles.buttonText}>Close</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>

      <Image 
        source={{ uri: `https://image.tmdb.org/t/p/w500${movie?.poster_path}` }} 
        style={sceneDetailStyles.poster}
      />
      <Text style={sceneDetailStyles.title}>{scene?.title || 'Scene Details'}</Text>
      <Text style={sceneDetailStyles.detail}>{scene?.scene || 'No scene info available.'}</Text>
      
      {scene?.youtubeId && (
          <TouchableOpacity 
            style={sceneDetailStyles.button} 
            onPress={handleReplayScene}
          >
              <Icon name="play-circle-outline" size={22} color={brandColors.text} style={{marginRight: 10}} />
              <Text style={sceneDetailStyles.buttonText}>Watch Clip</Text>
          </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// --- Navigation Setup ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainApp = () => (
  <Tab.Navigator screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
      else if (route.name === 'Showtime') iconName = focused ? 'film' : 'film-outline';
      else if (route.name === 'Community') iconName = focused ? 'people' : 'people-outline';
      else if (route.name === 'Profile') iconName = focused ? 'person-circle' : 'person-circle-outline';
      return <Icon name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: brandColors.primary,
    tabBarInactiveTintColor: 'gray',
    headerTitle: () => <LogoTitle />,
    headerStyle: { backgroundColor: brandColors.darkBlue, borderBottomWidth: 0 },
    headerTitleAlign: 'center',
    tabBarStyle: { backgroundColor: brandColors.darkBlue, borderTopWidth: 0 },
  })}>
    <Tab.Screen name="Search" component={SearchScreen} />
    <Tab.Screen name="Showtime" component={ShowtimeScreen} />
    <Tab.Screen name="Community" component={CommunityScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
        const value = await AsyncStorage.getItem('@hasOnboarded');
        if (value !== null) {
            setHasOnboarded(true);
        }
        setCheckingOnboarding(false);
    };
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (loading) {
          setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleOnboardingComplete = async () => {
    try {
        await AsyncStorage.setItem('@hasOnboarded', 'true');
        setHasOnboarded(true);
    } catch (e) {
        console.error("Failed to save onboarding status.", e);
    }
  };

  if (loading || checkingOnboarding) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: brandColors.background }}><ActivityIndicator size="large" color={brandColors.primary} /></View>;
  }

  return (
    <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <Stack.Navigator screenOptions={{
            headerShown: false,
            headerStyle: { backgroundColor: brandColors.darkBlue },
            headerTintColor: brandColors.primary,
            headerTitleAlign: 'center',
        }}>
            {!hasOnboarded ? (
                <Stack.Screen name="Onboarding">
                    {props => <OnboardingScreen {...props} onComplete={handleOnboardingComplete} />}
                </Stack.Screen>
            ) : user ? (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Main" component={MainApp} options={{ gestureEnabled: false }} />
              <Stack.Screen name="SceneDetail" component={SceneDetailScreen} options={{ headerShown: true, title: 'Scene Details' }} />
            </>
            ) : (
            <Stack.Screen name="Login" component={LoginScreen} />
            )}
        </Stack.Navigator>
    </NavigationContainer>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  screenContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: brandColors.background },
});
const loginStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: brandColors.darkBlue, justifyContent: 'center', padding: 20 },
    logo: { width: '90%', height: 80, alignSelf: 'center', marginBottom: 40 },
    input: { backgroundColor: '#222', color: 'white', padding: 12, marginBottom: 15, borderRadius: 8 },
    button: { backgroundColor: brandColors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    buttonText: { color: brandColors.text, fontWeight: 'bold' },
    secondaryButton: { alignItems: 'center', padding: 10 },
    secondaryButtonText: { color: '#888', textDecorationLine: 'underline' },
});
const homeStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: brandColors.darkBlue, alignItems: 'center', justifyContent: 'center', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: brandColors.primary, marginBottom: 10 },
    subtitle: { color: brandColors.text, textAlign: 'center', marginBottom: 30 },
    button: { width: '100%', backgroundColor: brandColors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginVertical: 8 },
    buttonText: { color: brandColors.text, fontSize: 16, fontWeight: '600' }
});
const searchStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: brandColors.darkBlue },
    mapContainer: { height: '40%', backgroundColor: brandColors.darkBlue },
    map: { ...StyleSheet.absoluteFillObject },
    mapLoadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: brandColors.darkBlue,
    },
    mapLoadingText: {
        color: brandColors.text,
        marginTop: 10,
    },
    controlsContainer: { padding: 10, backgroundColor: brandColors.darkBlue },
    input: { backgroundColor: '#222', color: 'white', borderRadius: 8, padding: 10, marginBottom: 10 },
    button: { backgroundColor: brandColors.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    buttonText: { color: brandColors.text, fontWeight: 'bold' },
    sliderLabel: { textAlign: 'center', color: brandColors.text, fontWeight: '500' },
    list: { flex: 1, backgroundColor: brandColors.darkBlue },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#333' },
    poster: { width: 50, height: 75, marginRight: 10, borderRadius: 4 },
    title: { flex: 1, color: brandColors.text, fontWeight: 'bold' },
});
const showtimeStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: brandColors.background },
    header: { fontSize: 22, fontWeight: 'bold', color: brandColors.primary, padding: 15, textAlign: 'center' },
    movieItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: brandColors.inputBackground, marginVertical: 8, marginHorizontal: 10, borderRadius: 10 },
    poster: { width: 100, height: 150, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
    textContainer: { flex: 1, padding: 10 },
    movieTitle: { fontSize: 16, fontWeight: 'bold', color: brandColors.text },
    movieOverview: { fontSize: 12, color: brandColors.secondaryText, marginTop: 5 },
});
const profileStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: brandColors.background },
    headerContainer: { alignItems: 'center', paddingVertical: 20 },
    email: { fontSize: 18, color: brandColors.text, marginTop: 10 },
    label: { color: brandColors.primary, fontSize: 16, fontWeight: 'bold', marginTop: 20, marginBottom: 5, marginHorizontal: 20 },
    input: { backgroundColor: brandColors.inputBackground, color: brandColors.text, borderColor: '#333', borderWidth: 1, borderRadius: 8, padding: 10, marginHorizontal: 20, fontSize: 16 },
    button: { backgroundColor: brandColors.primary, padding: 15, borderRadius: 8, alignItems: 'center', margin: 20 },
    buttonText: { color: brandColors.text, fontWeight: 'bold', fontSize: 16 },
    signOutButton: { backgroundColor: '#E74C3C', marginTop: 10 },
    subheader: { fontSize: 20, fontWeight: 'bold', color: brandColors.primary, marginTop: 30, marginBottom: 10, marginHorizontal: 20 },
    favoriteItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: brandColors.inputBackground, padding: 10, marginHorizontal: 20, marginBottom: 10, borderRadius: 8 },
    favPoster: { width: 40, height: 60, marginRight: 10, borderRadius: 4 },
    favTitle: { flex: 1, color: brandColors.text, fontWeight: '600' },
    noItemsText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginHorizontal: 20 },
});
const communityStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: brandColors.background, padding: 20 },
    header: { fontSize: 24, color: brandColors.primary, marginBottom: 20, fontWeight: 'bold' },
    input: { backgroundColor: brandColors.inputBackground, color: brandColors.text, padding: 10, borderRadius: 10, marginBottom: 15, borderColor: '#333', borderWidth: 1 },
    uploadBtn: { backgroundColor: '#444', padding: 12, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    uploadBtnText: { color: brandColors.text, fontWeight: '600' },
    submitBtn: { backgroundColor: brandColors.primary, padding: 15, borderRadius: 10, alignItems: 'center' },
    submitBtnText: { color: brandColors.text, fontWeight: 'bold' }
});
const sceneDetailStyles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: brandColors.background },
    poster: { width: '100%', height: 300, borderRadius: 10, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: brandColors.primary, marginBottom: 10, },
    detail: { fontSize: 16, color: brandColors.text, lineHeight: 24 },
    button: { backgroundColor: brandColors.accent, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, flexDirection: 'row', justifyContent: 'center' },
    buttonText: { color: brandColors.text, fontWeight: 'bold', fontSize: 16 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' },
    modalView: { width: '90%', height: '40%', backgroundColor: brandColors.darkBlue, borderRadius: 20, padding: 20, alignItems: 'center' },
    video: { width: '100%', flex: 1, marginBottom: 15 },
});

const emptyStateStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: 30,
        marginBottom: 30,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: brandColors.text,
        marginTop: 15,
    },
    message: {
        fontSize: 16,
        color: brandColors.secondaryText,
        textAlign: 'center',
        marginTop: 10,
    },
});

const onboardingStyles = StyleSheet.create({
    wrapper: { backgroundColor: brandColors.darkBlue },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: brandColors.darkBlue,
        padding: 30,
    },
    title: {
        color: brandColors.primary,
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: 30,
        marginBottom: 15,
    },
    text: {
        color: brandColors.text,
        fontSize: 18,
        textAlign: 'center',
        lineHeight: 25,
    },
    doneButton: {
        backgroundColor: brandColors.primary,
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        marginTop: 40,
    },
    doneButtonText: {
        color: brandColors.darkBlue,
        fontSize: 18,
        fontWeight: 'bold',
    },
});


export default App;
