import { useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  setDoc 
} from 'firebase/firestore';

export interface AdConfig {
  id: string;
  placement: 'left' | 'right' | 'mobile_bottom';
  size: 'big' | 'small';
  name: string;
  link: string;
  imageUrl?: string;
}

export function useAds() {
  const [ads, setAds] = useState<AdConfig[]>([]);
  const [adsEnabled, setAdsEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to real-time updates from Firestore
  useEffect(() => {
    // 1. Listen for Ads Collection
    const unsubscribeAds = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const adsList: AdConfig[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdConfig[];
      setAds(adsList);
    }, (error) => {
      console.error("Firebase Ads Error:", error);
      if (error.code === 'permission-denied') {
        alert("Firebase Permission Denied! Please check your Firestore Security Rules.");
      }
    });

    // 2. Listen for Global Config
    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setAdsEnabled(docSnap.data().adsEnabled === true);
      } else {
        setAdsEnabled(false);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase Config Error:", error);
    });

    return () => {
      unsubscribeAds();
      unsubscribeConfig();
    };
  }, []);

  const addAd = async (ad: Omit<AdConfig, 'id'>) => {
    try {
      await addDoc(collection(db, 'ads'), ad);
    } catch (error) {
      console.error("Error adding ad:", error);
      alert("Failed to save ad to database.");
    }
  };

  const deleteAd = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'ads', id));
    } catch (error) {
      console.error("Error deleting ad:", error);
      alert("Failed to delete ad from database.");
    }
  };

  const toggleAds = async () => {
    try {
      await setDoc(doc(db, 'config', 'global'), { adsEnabled: !adsEnabled }, { merge: true });
    } catch (error) {
      console.error("Error toggling ads:", error);
      alert("Failed to toggle global ads status.");
    }
  };

  return {
    ads,
    adsEnabled,
    loading,
    addAd,
    deleteAd,
    toggleAds,
  };
}
