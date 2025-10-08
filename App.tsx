import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from './src/supabaseClient';
import type { Product, Category, CartItem, Order, OrderItem } from './types';

// --- HELPER & UI COMPONENTS ---

const ShoppingCartIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}
const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 group">
        <div className="h-48 overflow-hidden">
            <img src={product.image_url || 'https://picsum.photos/400/300'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-semibold text-stone-800 font-serif">{product.name}</h3>
            {product.description && <p className="text-sm text-stone-600 mt-1 flex-grow">{product.description}</p>}
            <div className="flex justify-between items-center mt-4">
                <span className="text-xl font-bold text-amber-900">
                    R$ {product.price.toFixed(2).replace('.', ',')}
                </span>
                <button
                    onClick={() => onAddToCart(product)}
                    className="bg-amber-800 text-white px-4 py-2 rounded-full hover:bg-amber-900 transition-colors text-sm font-semibold"
                >
                    Adicionar
                </button>
            </div>
        </div>
    </div>
);

interface CartItemRowProps {
    item: CartItem;
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemoveItem: (productId: number) => void;
}

const CartItemRow: React.FC<CartItemRowProps> = ({ item, onUpdateQuantity, onRemoveItem }) => {
    const [quantityInput, setQuantityInput] = useState(item.quantity.toString());

    useEffect(() => {
        setQuantityInput(item.quantity.toString());
    }, [item.quantity]);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuantityInput(e.target.value);
    };

    const handleQuantityBlur = () => {
        const newQuantity = parseInt(quantityInput, 10);
        if (isNaN(newQuantity) || newQuantity < 1) {
            setQuantityInput(item.quantity.toString());
        } else {
            onUpdateQuantity(item.id, newQuantity);
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    return (
        <div className="flex items-center space-x-4">
            <img src={item.image_url || 'https://picsum.photos/200/200'} alt={item.name} className="w-20 h-20 rounded-md object-cover" />
            <div className="flex-grow">
                <h4 className="font-semibold text-stone-800">{item.name}</h4>
                <p className="text-sm text-amber-900 font-bold">R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))} className="w-7 h-7 bg-stone-200 rounded-full font-bold text-stone-700">-</button>
                <input
                    type="number"
                    min="1"
                    value={quantityInput}
                    onChange={handleQuantityChange}
                    onBlur={handleQuantityBlur}
                    onKeyPress={handleKeyPress}
                    aria-label={`Quantidade de ${item.name}`}
                    className="w-12 text-center py-1 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-800 focus:border-amber-800"
                />
                <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-stone-200 rounded-full font-bold text-stone-700">+</button>
            </div>
            <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700" aria-label={`Remover ${item.name}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
};

interface CheckoutFormProps {
    subtotal: number;
    onSubmit: (details: {
        name: string;
        whatsapp: string;
        address: string;
        paymentMethod: string;
        data_agendamento: string;
        turno: string;
        horario_agendamento: string;
    }) => void;
    onBack: () => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ subtotal, onSubmit, onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        address: 'Entregas, somente com retirada em loja',
        paymentMethod: '',
        data_agendamento: '',
        turno: '',
        horario_agendamento: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, paymentMethod: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.paymentMethod || !formData.data_agendamento || !formData.turno || !formData.horario_agendamento) {
            alert('Por favor, preencha todos os campos de agendamento e pagamento.');
            return;
        }
        onSubmit(formData);
    };
    
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
                    <p className="font-bold">Atenção ao Horário de Encomendas</p>
                    <p>Pedidos devem ser feitos com um dia de antecedência ou antes das 10:00 da manhã do dia atual.</p>
                </div>
                {subtotal > 200 && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
                        <p className="font-bold">Retirada de Pedidos Grandes</p>
                        <p>Para pedidos acima de R$ 200,00 com opção de retirada, é necessário o pagamento antecipado de 50%.</p>
                    </div>
                )}
                <div className="space-y-4">
                    {/* Campos de Agendamento */}
                    <fieldset className="border-t pt-4">
                        <legend className="text-md font-medium text-stone-700 mb-2">Agendamento da Retirada</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="data_agendamento" className="block text-sm font-medium text-stone-700">Data para Retirada</label>
                                <input type="date" id="data_agendamento" value={formData.data_agendamento} onChange={handleChange} min={getTodayString()} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-800 focus:border-amber-800" required />
                            </div>
                            <div>
                                <label htmlFor="turno" className="block text-sm font-medium text-stone-700">Turno</label>
                                <select id="turno" value={formData.turno} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-800 focus:border-amber-800" required>
                                    <option value="" disabled>Selecione...</option>
                                    <option value="manha">Manhã</option>
                                    <option value="tarde">Tarde</option>
                                    <option value="noite">Noite</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="horario_agendamento" className="block text-sm font-medium text-stone-700">Horário Específico</label>
                                <input type="time" id="horario_agendamento" value={formData.horario_agendamento} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-800 focus:border-amber-800" required />
                            </div>
                        </div>
                    </fieldset>
                    
                    {/* Campos de Informações Pessoais */}
                     <fieldset className="border-t pt-4">
                        <legend className="text-md font-medium text-stone-700 mb-2">Suas Informações</legend>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-stone-700">Nome Completo</label>
                            <input type="text" id="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-800 focus:border-amber-800" required />
                        </div>
                        <div className="mt-4">
                            <label htmlFor="whatsapp" className="block text-sm font-medium text-stone-700">WhatsApp</label>
                            <input type="tel" id="whatsapp" value={formData.whatsapp} onChange={handleChange} className="mt-1 block w-full px-3 py-2 bg-white border border-stone-300 rounded-md shadow-sm focus:outline-none focus:ring-amber-800 focus:border-amber-800" placeholder="(XX) XXXXX-XXXX" required />
                        </div>
                        <div className="mt-4">
                            <label htmlFor="address" className="block text-sm font-medium text-stone-700">Retirada</label>
                            <input type="text" id="address" value={formData.address} readOnly className="mt-1 block w-full px-3 py-2 bg-stone-100 border border-stone-300 rounded-md shadow-sm focus:outline-none text-stone-500" />
                        </div>
                    </fieldset>

                    {/* Campo de Pagamento */}
                    <fieldset className="border-t pt-4">
                        <legend className="text-md font-medium text-stone-700 mb-2">Método de Pagamento</legend>
                        <div className="space-y-2">
                            {['PIX', 'Cartão de Crédito/Débito', 'Dinheiro'].map(method => (
                                <label key={method} className="flex items-center p-3 border rounded-md has-[:checked]:bg-amber-100 has-[:checked]:border-amber-800">
                                    <input type="radio" name="payment" value={method} checked={formData.paymentMethod === method} onChange={handlePaymentChange} className="h-4 w-4 text-amber-800 focus:ring-amber-800" />
                                    <span className="ml-3 text-stone-700">{method}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>
                </div>
            </div>
            <div className="p-6 border-t mt-auto space-y-4 bg-stone-50 -mx-6">
                <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors">
                    Confirmar Pedido
                </button>
                <button type="button" onClick={onBack} className="w-full text-center text-stone-600 font-semibold py-2">
                    Voltar ao Carrinho
                </button>
            </div>
        </form>
    );
};


interface CartSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    cartItems: CartItem[];
    onUpdateQuantity: (productId: number, newQuantity: number) => void;
    onRemoveItem: (productId: number) => void;
    onSubmitOrder: (details: {
        name: string;
        whatsapp: string;
        address: string;
        paymentMethod: string;
        data_agendamento: string;
        turno: string;
        horario_agendamento: string;
    }) => void;
}
const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem, onSubmitOrder }) => {
    const [view, setView] = useState<'cart' | 'checkout' | 'success'>('cart');
    
    const subtotal = useMemo(() => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    }, [cartItems]);

    useEffect(() => {
        if (isOpen) {
            setView('cart');
        } else {
            // Optional: Add a delay before resetting view if you have animations
            setTimeout(() => setView('cart'), 300);
        }
    }, [isOpen]);

    const handleOrderSubmit = (details: { name: string; whatsapp: string; address: string; paymentMethod: string; }) => {
        onSubmitOrder(details);
        setView('success');
    };

    return (
        <div className={`fixed top-0 right-0 h-full w-full md:w-96 lg:w-1/3 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} z-50 flex flex-col`}>
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-2xl font-bold font-serif text-stone-800">
                    {view === 'cart' && 'Seu Pedido'}
                    {view === 'checkout' && 'Finalizar Pedido'}
                    {view === 'success' && 'Pedido Enviado!'}
                </h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-stone-100">
                    <CloseIcon className="w-6 h-6 text-stone-600" />
                </button>
            </div>

            {view === 'cart' && (
                <>
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {cartItems.length === 0 ? (
                            <p className="text-stone-500 text-center mt-8">Seu carrinho está vazio.</p>
                        ) : (
                            cartItems.map(item => (
                                <CartItemRow
                                    key={item.id}
                                    item={item}
                                    onUpdateQuantity={onUpdateQuantity}
                                    onRemoveItem={onRemoveItem}
                                />
                            ))
                        )}
                    </div>
                    <div className="p-4 border-t space-y-4 bg-stone-50">
                        <div className="flex justify-between font-semibold text-lg">
                            <span>Subtotal</span>
                            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <button 
                            onClick={() => setView('checkout')}
                            disabled={cartItems.length === 0}
                            className="w-full bg-amber-800 text-white py-3 rounded-lg font-bold hover:bg-amber-900 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed">
                            Finalizar Compra
                        </button>
                    </div>
                </>
            )}

            {view === 'checkout' && (
                <CheckoutForm subtotal={subtotal} onSubmit={handleOrderSubmit} onBack={() => setView('cart')} />
            )}

            {view === 'success' && (
                <div className="flex flex-col items-center justify-center text-center p-8 flex-grow">
                    <svg className="w-24 h-24 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-2xl font-bold text-stone-800">Obrigado!</h3>
                    <p className="text-stone-600 mt-2">Seu pedido foi recebido e está sendo processado. Entraremos em contato pelo WhatsApp para confirmação.</p>
                    <button onClick={onClose} className="mt-8 bg-amber-800 text-white py-3 px-8 rounded-lg font-bold hover:bg-amber-900 transition-colors">
                        Fechar
                    </button>
                </div>
            )}
        </div>
    );
};


// --- MAIN APP COMPONENT ---

export default function App() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const { data: categoriesData, error: categoriesError } = await supabase.from('categories').select('*');
                if (categoriesError) throw categoriesError;
                setCategories(categoriesData || []);

                const { data: productsData, error: productsError } = await supabase.from('products').select('*');
                if (productsError) throw productsError;
                setProducts(productsData || []);

            } catch (error) {
                console.error("Error fetching data:", error);
                setToastMessage("Erro ao carregar o cardápio. Tente novamente mais tarde.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddToCart = useCallback((product: Product) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });

        setToastMessage(`${product.name} adicionado ao carrinho!`);
    }, []);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleUpdateQuantity = useCallback((productId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(productId);
        } else {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity: newQuantity } : item
                )
            );
        }
    }, []);

    const handleRemoveItem = useCallback((productId: number) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
    }, []);

    const handleSubmitOrder = async (details: {
        name: string; 
        whatsapp: string; 
        address: string; 
        paymentMethod: string; 
        data_agendamento: string;
        turno: string;
        horario_agendamento: string;
    }) => {
        const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        try {
            // 1. Create the order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_name: details.name,
                    customer_whatsapp: details.whatsapp,
                    delivery_address: details.address,
                    payment_method: details.paymentMethod,
                    status: 'pending',
                    subtotal: subtotal,
                    // --- NOVOS CAMPOS ---
                    data_agendamento: details.data_agendamento,
                    turno: details.turno,
                    horario_agendamento: details.horario_agendamento
                }])
                .select()
                .single();

            if (orderError) throw orderError;
            if (!orderData) throw new Error("Failed to create order.");

            const newOrderId = orderData.id;

            // 2. Create order items
            const orderItemsToInsert = cartItems.map(item => ({
                order_id: newOrderId,
                product_id: item.id,
                quantity: item.quantity,
                unit_price: item.price
            }));

            const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsToInsert);

            if (orderItemsError) throw orderItemsError;

            // 3. Clear cart after successful submission
            setCartItems([]);

        } catch (error) {
            console.error("Error submitting order:", error);
            alert("Houve um erro ao enviar seu pedido. Por favor, tente novamente.");
            // Don't close the cart or clear items if submission fails
            throw error; // re-throw to prevent success UI from showing
        }
    };

    const filteredProducts = useMemo(() => {
        if (selectedCategory === 'all') {
            return products;
        }
        return products.filter(product => product.category_id === selectedCategory);
    }, [selectedCategory, products]);

    const cartCount = useMemo(() => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    }, [cartItems]);

    return (
        <div className="bg-stone-50 min-h-screen">
            <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-amber-900 font-serif">Panificação Lima Rocha</h1>
                    <button onClick={() => setIsCartOpen(true)} className="relative p-2 rounded-full hover:bg-stone-100">
                        <ShoppingCartIcon className="w-7 h-7 text-stone-700" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="text-center mb-12">
                     <h2 className="text-5xl font-extrabold text-stone-800 font-serif mb-2">Nosso Cardápio</h2>
                     <p className="text-lg text-stone-600 max-w-2xl mx-auto">Feito com carinho, para momentos especiais. Explore nossas delícias!</p>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">Carregando cardápio...</div>
                ) : (
                    <>
                        <div className="flex justify-center flex-wrap gap-3 mb-8">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-6 py-2 rounded-full font-semibold transition-colors ${selectedCategory === 'all' ? 'bg-amber-800 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'}`}
                            >
                                Todos
                            </button>
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-6 py-2 rounded-full font-semibold transition-colors ${selectedCategory === category.id ? 'bg-amber-800 text-white' : 'bg-white text-stone-700 hover:bg-stone-100'}`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                            ))}
                        </div>
                    </>
                )}
            </main>

            <CartSidebar 
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                onSubmitOrder={handleSubmitOrder}
            />
            {isCartOpen && <div onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/50 z-40 transition-opacity"></div>}

            {toastMessage && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}