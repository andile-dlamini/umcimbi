-- Create enums
CREATE TYPE public.app_role AS ENUM ('user', 'vendor', 'admin');
CREATE TYPE public.preferred_language AS ENUM ('zulu', 'english');
CREATE TYPE public.event_type AS ENUM ('umembeso', 'umabo');
CREATE TYPE public.vendor_category AS ENUM ('decor', 'catering', 'livestock', 'tents', 'transport', 'attire', 'photographer', 'other');
CREATE TYPE public.task_category AS ENUM ('gifts', 'decor', 'livestock', 'transport', 'catering', 'attire', 'finance', 'venue', 'other');
CREATE TYPE public.budget_category AS ENUM ('gifts', 'decor', 'catering', 'livestock', 'transport', 'attire', 'venue', 'other');
CREATE TYPE public.rsvp_status AS ENUM ('invited', 'yes', 'no', 'unknown');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone_number TEXT,
  full_name TEXT,
  email TEXT,
  preferred_language preferred_language DEFAULT 'english',
  is_profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category vendor_category NOT NULL DEFAULT 'other',
  location TEXT,
  about TEXT,
  price_range_text TEXT,
  whatsapp_number TEXT,
  phone_number TEXT,
  email TEXT,
  website_url TEXT,
  languages TEXT[] DEFAULT ARRAY['English'],
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  added_to_events_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type event_type NOT NULL,
  date DATE,
  location TEXT,
  estimated_guest_count INTEGER DEFAULT 50,
  size TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event_vendors junction table
CREATE TABLE public.event_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE NOT NULL,
  role_or_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (event_id, vendor_id)
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category task_category DEFAULT 'other',
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  assignee_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create budget_items table
CREATE TABLE public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  category budget_category DEFAULT 'other',
  description TEXT NOT NULL,
  planned_amount NUMERIC DEFAULT 0,
  actual_amount NUMERIC DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create guests table
CREATE TABLE public.guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  rsvp_status rsvp_status DEFAULT 'invited',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, phone_number)
  VALUES (NEW.id, NEW.email, NEW.phone);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers for all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON public.vendors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_budget_items_updated_at BEFORE UPDATE ON public.budget_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON public.guests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for vendors (public read, owner write)
CREATE POLICY "Vendors are viewable by everyone" ON public.vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create their own vendor profile" ON public.vendors FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Vendor owners can update their profile" ON public.vendors FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Vendor owners can delete their profile" ON public.vendors FOR DELETE USING (auth.uid() = owner_user_id);

-- RLS Policies for events
CREATE POLICY "Users can view their own events" ON public.events FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can create their own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Users can update their own events" ON public.events FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Users can delete their own events" ON public.events FOR DELETE USING (auth.uid() = owner_user_id);

-- RLS Policies for event_vendors
CREATE POLICY "Users can view event_vendors for their events" ON public.event_vendors FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_vendors.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can add vendors to their events" ON public.event_vendors FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_vendors.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can remove vendors from their events" ON public.event_vendors FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = event_vendors.event_id AND events.owner_user_id = auth.uid()));

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks for their events" ON public.tasks FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can create tasks for their events" ON public.tasks FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can update tasks for their events" ON public.tasks FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can delete tasks for their events" ON public.tasks FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = tasks.event_id AND events.owner_user_id = auth.uid()));

-- RLS Policies for budget_items
CREATE POLICY "Users can view budget_items for their events" ON public.budget_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can create budget_items for their events" ON public.budget_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can update budget_items for their events" ON public.budget_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can delete budget_items for their events" ON public.budget_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = budget_items.event_id AND events.owner_user_id = auth.uid()));

-- RLS Policies for guests
CREATE POLICY "Users can view guests for their events" ON public.guests FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can create guests for their events" ON public.guests FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can update guests for their events" ON public.guests FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.owner_user_id = auth.uid()));
CREATE POLICY "Users can delete guests for their events" ON public.guests FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.events WHERE events.id = guests.event_id AND events.owner_user_id = auth.uid()));

-- Seed sample vendors (public data)
INSERT INTO public.vendors (name, category, location, about, price_range_text, phone_number, whatsapp_number, rating, review_count, image_urls, languages) VALUES
('Zulu Traditions Decor', 'decor', 'Durban, KwaZulu-Natal', 'Specializing in traditional Zulu wedding decor, including isicathamiya-inspired setups, beadwork displays, and modern African fusion designs.', 'From R5,000', '031-555-0101', '27315550101', 4.8, 124, ARRAY['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400'], ARRAY['isiZulu', 'English']),
('Mama Dlamini Catering', 'catering', 'Soweto, Gauteng', 'Authentic traditional catering for umembeso and umabo ceremonies. Famous for our umqombothi, uphuthu, and slow-roasted meats.', 'From R150/head', '011-555-0102', '27115550102', 4.9, 89, ARRAY['https://images.unsplash.com/photo-1555244162-803834f70033?w=400'], ARRAY['isiZulu', 'English', 'Sesotho']),
('Royal Kraal Livestock', 'livestock', 'Pietermaritzburg, KwaZulu-Natal', 'Quality cattle and goats for traditional ceremonies. We provide delivery and can assist with ceremonial preparations.', 'From R8,000/cow', '033-555-0103', '27335550103', 4.7, 67, ARRAY['https://images.unsplash.com/photo-1500595046743-cd271d694e30?w=400'], ARRAY['isiZulu', 'English']),
('Ubuntu Tents & Marquees', 'tents', 'Johannesburg, Gauteng', 'Premium tent hire for all occasions. Traditional and modern styles available, including stretch tents and frame marquees.', 'From R3,500', '011-555-0104', '27115550104', 4.6, 203, ARRAY['https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=400'], ARRAY['English', 'isiZulu', 'Sesotho']),
('Indoni Photography', 'photographer', 'Durban, KwaZulu-Natal', 'Capturing the beauty of traditional ceremonies with a modern eye. Drone coverage, same-day edits, and cinematic videos available.', 'From R4,500', '031-555-0105', '27315550105', 4.9, 156, ARRAY['https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400'], ARRAY['isiZulu', 'English']),
('Isidwaba Creations', 'attire', 'Ulundi, KwaZulu-Natal', 'Handcrafted traditional Zulu attire for brides, grooms, and wedding parties. Custom beadwork and leather goods.', 'From R2,500', '035-555-0106', '27355550106', 4.8, 91, ARRAY['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400'], ARRAY['isiZulu', 'English']),
('Safari Shuttle Services', 'transport', 'Johannesburg, Gauteng', 'Luxury and standard transport for wedding parties. Fleet includes quantum taxis, minibuses, and luxury sedans.', 'From R1,500', '011-555-0107', '27115550107', 4.5, 78, ARRAY['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400'], ARRAY['English', 'isiZulu', 'Sesotho']),
('Themba Events', 'other', 'Cape Town, Western Cape', 'Full-service event planning for traditional ceremonies. We coordinate everything from negotiations to the final celebration.', 'Custom quotes', '021-555-0108', '27215550108', 4.7, 45, ARRAY['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400'], ARRAY['English', 'isiXhosa', 'isiZulu']);