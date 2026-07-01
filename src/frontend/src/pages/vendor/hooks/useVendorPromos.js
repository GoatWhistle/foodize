import { useState, useEffect } from 'react';
import { translateApiError } from '../../../utils/translateApiError';
import { promoService } from '../../../services/promoService';

export const useVendorPromos = ({ selectedRestaurant, activeTab }) => {
  const [promosList, setPromosList] = useState([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promosError, setPromosError] = useState('');
  const [promosSuccess, setPromosSuccess] = useState('');
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'PERCENT',
    discount_value: '',
    max_uses: '',
    expires_at: '',
    first_order_only: false,
    min_order_amount: '',
    menu_category: '',
  });
  const [promoFormLoading, setPromoFormLoading] = useState(false);
  const [deactivatingPromo, setDeactivatingPromo] = useState(null);

  useEffect(() => {
    if (activeTab === 'promos') {
      setPromosLoading(true);
      setPromosError('');
      promoService
        .list()
        .then((res) => {
          const list = Array.isArray(res.data?.data) ? res.data.data : [];
          setPromosList(list);
        })
        .catch(() => setPromosError('Не удалось загрузить промокоды'))
        .finally(() => setPromosLoading(false));
    }
  }, [activeTab]);

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    setPromoFormLoading(true);
    setPromosError('');
    try {
      const payload = {
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
      setPromoForm({
        code: '',
        discount_type: 'PERCENT',
        discount_value: '',
        max_uses: '',
        expires_at: '',
        first_order_only: false,
        min_order_amount: '',
        menu_category: '',
      });
      setShowPromoForm(false);
      setPromosSuccess('Промокод создан');
      setTimeout(() => setPromosSuccess(''), 2000);
      const res = await promoService.list();
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      setPromosList(list);
    } catch (err) {
      setPromosError(translateApiError(err, 'Ошибка создания промокода'));
    } finally {
      setPromoFormLoading(false);
    }
  };

  const handleDeactivatePromo = async (code) => {
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
