import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    // TODO
    try {
      const checkProductInCart = cart.find(
        (product) => product.id === productId
      );

      if (!checkProductInCart) {
        const product = await api.get<Product>(`/products/${productId}`);
        const productStock = await api.get<Stock>(`/stock/${productId}`);

        if (productStock.data.amount > 0) {
          setCart([...cart, { ...product.data, amount: 1 }]);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify([...cart, { ...product.data, amount: 1 }])
          );
          toast.success("Produto foi adicionado ao carrinho!");
          return;
        }
      }

      if (checkProductInCart) {
        const productStock = await api.get(`/stock/${productId}`);

        if (productStock.data.amount > checkProductInCart.amount) {
          const updatedCart = cart.map((productCart) =>
            productCart.id === productId
              ? {
                  ...productCart,
                  amount: productCart.amount + 1,
                }
              : productCart
          );

          setCart(updatedCart);
          localStorage.setItem(
            "@RocketShoes:cart",
            JSON.stringify(updatedCart)
          );
          return;
        } else {
          toast.error("Quantidade solicitada fora de estoque");
        }
      }
    } catch {
      toast.error("Erro na adição do produto");
      return;
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const checkProductInCartIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (checkProductInCartIndex === -1) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const updatedCart = cart.filter((product) => product.id !== productId);
      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na remoção do produto");
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if (amount < 1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const checkProductInCartIndex = cart.findIndex(
        (product) => product.id === productId
      );

      if (checkProductInCartIndex === -1) {
        toast.error("Erro na alteração de quantidade do produto");
        return;
      }

      const productStock = await api.get<Stock>(`/stock/${productId}`);

      if (amount > productStock.data.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = cart.map((productCart) =>
        productCart.id === productId
          ? { ...productCart, amount: amount }
          : productCart
      );

      setCart(updatedCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
      return;
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
