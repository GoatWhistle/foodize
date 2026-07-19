import { useState, useEffect } from 'react';
import { translateApiError } from '@shared/utils/translateApiError';
import { promoService } from '@shared/services/promoService';
import type { Promo, Restaurant, Schemas } from '@shared/types/models';

type PromoCreate = Schemas['PromoCreate'];

export interface PromoForm {
  code: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: string;
  max_uses: string;
  expires_at: string;
  first_order_only: boolean;
  min_order_amount: string;
  menu_category: string;
}

const EMPTY_PROMO_FORM: PromoForm = {
  code: '',
  discount_type: 'PERCENT',
  discount_value: '',
  max_uses: '',
  expires_at: '',
  first_order_only: false,
  min_order_amount: '',
  menu_category: '',
};

interface UseVendorPromosParams {
  selectedRestaurant: Restaurant | null;
  activeTab: string;
}

export const useVendorPromos = ({ selectedRestaurant, activeTab }: UseVendorPromosParams) => {
  const [promosList, setPromosList] = useState<Promo[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promosError, setPromosError] = useState('');
  const [promosSuccess, setPromosSuccess] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState<PromoForm>(EMPTY_PROMO_FORM);
  const [promoFormLoading, setPromoFormLoading] = useState(false);
  const [deactivatingPromo, setDeactivatingPromo] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'promos') {
      setPromosLoading(true);
      setPromosError('');
      void (async () => {
        try {
          const response = await promoService.list();
          const list = Array.isArray(response.data.data) ? response.data.data : [];
          setPromosList(list);
        } catch {
          setPromosError('Не удалось загрузить промокоды');
        } finally {
          setPromosLoading(false);
        }
      })();
    }
  }, [activeTab]);

  const handleCreatePromo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRestaurant) return;
    setPromoFormLoading(true);
    setPromosError('');
    try {
      const payload: PromoCreate = {
        code: promoForm.code,
        discount_type: promoForm.discount_type,
        discount_value: parseInt(promoForm.discount_value, 10),
        restaurant_id: selectedRestaurant.id,
        ...(promoForm.max_uses ? { max_uses: parseInt(promoForm.max_uses, 10) } : {}),
        ...(promoForm.expires_at
          ? { expires_at: new Date(promoForm.expires_at).toISOString() }
          : {}),
        first_order_only: promoForm.first_order_only,
        ...(promoForm.min_order_amount
          ? { min_order_amount: parseInt(promoForm.min_order_amount, 10) }
          : {}),
        ...(promoForm.menu_category ? { menu_category: promoForm.menu_category } : {}),
      };
      await promoService.create(payload);
      setPromoForm(EMPTY_PROMO_FORM);
      setShowPromoForm(false);
      setPromosSuccess('Промокод создан');
      setTimeout(() => { setPromosSuccess(''); }, 2000);
      const response = await promoService.list();
      const list = Array.isArray(response.data.data) ? response.data.data : [];
      setPromosList(list);
    } catch (error) {
      setPromosError(translateApiError(error, 'Ошибка создания промокода'));
    } finally {
      setPromoFormLoading(false);
    }
  };

  const handleDeactivatePromo = async (code: string) => {
    setPromosError('');
    setDeactivatingPromo(code);
    try {
      await promoService.deactivate(code);
      setPromosList((prev) => prev.filter((p) => p.code !== code));
    } catch {
      setPromosError('Не удалось деактивировать промокод');
    } finally {
      setDeactivatingPromo(null);
    }
  };

  return {
    promosList,
    promosLoading,
    promosError,
    promosSuccess,
    showPromoForm, setShowPromoForm,
    promoForm, setPromoForm,
    promoFormLoading,
    deactivatingPromo,
    handleCreatePromo,
    handleDeactivatePromo,
  };
};
