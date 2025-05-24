import { FEATURES } from "@/lib/constants";
import { motion } from "framer-motion";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 font-heading gradient-heading">
            Como o CIP Shopee transforma sua loja
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Todas as ferramentas que você precisa para escalar as vendas na Shopee com inteligência artificial.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-card p-6 rounded-xl shadow-sm card-hover border"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <i className={`${feature.icon} text-2xl text-primary`}></i>
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
